import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Récupérer les sessions depuis OpenClaw
    const { stdout, stderr } = await execAsync("openclaw sessions list --json");

    if (stderr) {
      console.error("Erreur stderr sessions list:", stderr);
    }

    const sessionsData = JSON.parse(stdout);
    const sessions = sessionsData.sessions || [];

    // Filtrer et trier les sessions
    const recentSessions = sessions
      .filter((session: any) => session.status === "active" || session.status === "completed")
      .sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
      .slice(0, 10) // Garder les 10 plus récentes
      .map((session: any) => ({
        id: session.sessionKey || session.id,
        name: session.label || session.agentId || "Unknown",
        agentId: session.agentId || "main",
        status: session.status || "unknown",
        lastActivity: session.lastActivity || new Date().toISOString(),
        tokens: session.tokens || { input: 0, output: 0, total: 0 },
        model: session.model || "unknown",
        messagesCount: session.messagesCount || 0,
        createdAt: session.createdAt || session.updatedAt || new Date().toISOString()
      }));

    // Calculer les KPIs
    const activeSessions = sessions.filter((s: any) => s.status === "active").length;
    const totalTokens = sessions.reduce((sum: number, s: any) => sum + (s.tokens?.total || 0), 0);
    const totalMessages = sessions.reduce((sum: number, s: any) => sum + (s.messagesCount || 0), 0);

    // Agréger par tool (agentId) et par skills
    const agents: Record<string, { count: number; successRate: number; avgLatency: number; sessions: any[] }> = {};
    const skills: Record<string, { count: number; successRate: number; avgLatency: number; sessions: any[] }> = {};

    sessions.forEach((session: any) => {
      const agentId = session.agentId || "main";
      if (!agents[agentId]) {
        agents[agentId] = { count: 0, successRate: 0, avgLatency: 0, sessions: [] };
      }

      agents[agentId].count++;
      agents[agentId].sessions.push(session);
      agents[agentId].avgLatency += (session.avgLatencyMs || 0) || 0;

      // Extraire les skills utilisés depuis la session
      const sessionSkills = session.skills || [];
      sessionSkills.forEach((skill: string) => {
        if (!skills[skill]) {
          skills[skill] = { count: 0, successRate: 0, avgLatency: 0, sessions: [] };
        }
        skills[skill].count++;
        skills[skill].sessions.push(session);
        skills[skill].avgLatency += (session.avgLatencyMs || 0) || 0;
      });
    });

    // Calculer success rate par agent
    Object.keys(agents).forEach(agentId => {
      const agent = agents[agentId];
      const completedSessions = agent.sessions.filter((s: any) => s.status === "completed").length;
      const totalSessions = agent.sessions.filter((s: any) => s.status === "completed" || s.status === "active").length;
      agent.successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 100;
      agent.avgLatency = agent.count > 0 ? Math.round(agent.avgLatency / agent.count) : 0;
    });

    // Calculer success rate par skill
    Object.keys(skills).forEach(skillName => {
      const skill = skills[skillName];
      const completedSessions = skill.sessions.filter((s: any) => s.status === "completed").length;
      const totalSessions = skill.sessions.filter((s: any) => s.status === "completed" || s.status === "active").length;
      skill.successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 100;
      skill.avgLatency = skill.count > 0 ? Math.round(skill.avgLatency / skill.count) : 0;
    });

    // Trier les agents par nombre d'appels
    const byAgent = Object.entries(agents)
      .map(([agentId, data]) => ({
        agentId,
        tool_name: agentId,
        count: data.count,
        success_rate: data.successRate,
        avg_latency_ms: data.avgLatency
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 agents

    // Trier les skills par nombre d'appels
    const bySkill = Object.entries(skills)
      .map(([skillName, data]) => ({
        skill_name: skillName,
        count: data.count,
        success_rate: data.successRate,
        avg_latency_ms: data.avgLatency
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 skills

    return NextResponse.json({
      recent_sessions: recentSessions,
      active_count: activeSessions,
      total_tokens: totalTokens,
      total_messages: totalMessages,
      total_sessions: sessions.length,
      kpis: {
        total_calls: sessions.length,
        success_rate: byAgent.length > 0 ? Math.round(byAgent.reduce((sum: number, a: any) => sum + a.success_rate, 0) / byAgent.length) : 100,
        avg_latency_ms: byAgent.length > 0 ? Math.round(byAgent.reduce((sum: number, a: any) => sum + a.avg_latency_ms, 0) / byAgent.length) : 0,
        total_tokens: totalTokens,
        unique_sessions: sessions.length
      },
      by_agent: byAgent,
      by_skill: bySkill
    });
  } catch (error: any) {
    console.error("Erreur API /api/agents:", error);

    // Fallback : tableau vide en cas d'erreur
    return NextResponse.json({
      recent_sessions: [],
      active_count: 0,
      total_tokens: 0,
      total_messages: 0,
      total_sessions: 0,
      error: "Erreur récupération sessions"
    }, { status: 500 });
  }
}
