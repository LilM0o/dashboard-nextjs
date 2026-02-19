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

    // Agréger par tool
    const tools: Record<string, { count: number; successRate: number; avgLatency: number; sessions: any[] }> = {};

    sessions.forEach((session: any) => {
      const agentId = session.agentId || "main";
      if (!tools[agentId]) {
        tools[agentId] = { count: 0, successRate: 0, avgLatency: 0, sessions: [] };
      }

      tools[agentId].count++;
      tools[agentId].sessions.push(session);
      tools[agentId].avgLatency += (session.avgLatencyMs || 0) || 0;
    });

    // Calculer success rate par agent
    Object.keys(tools).forEach(agentId => {
      const tool = tools[agentId];
      const completedSessions = tool.sessions.filter((s: any) => s.status === "completed").length;
      const totalSessions = tool.sessions.filter((s: any) => s.status === "completed" || s.status === "active").length;
      tool.successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 100;
      tool.avgLatency = tool.count > 0 ? Math.round(tool.avgLatency / tool.count) : 0;
    });

    // Trier par nombre d'appels
    const byTool = Object.entries(tools)
      .map(([agentId, data]) => ({
        agentId,
        tool_name: agentId,
        count: data.count,
        success_rate: data.successRate,
        avg_latency_ms: data.avgLatency
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    return NextResponse.json({
      recent_sessions: recentSessions,
      active_count: activeSessions,
      total_tokens: totalTokens,
      total_messages: totalMessages,
      total_sessions: sessions.length,
      kpis: {
        total_calls: sessions.length,
        success_rate: byTool.length > 0 ? Math.round(byTool.reduce((sum: number, t: any) => sum + t.success_rate, 0) / byTool.length) : 100,
        avg_latency_ms: byTool.length > 0 ? Math.round(byTool.reduce((sum: number, t: any) => sum + t.avg_latency_ms, 0) / byTool.length) : 0,
        total_tokens: totalTokens,
        unique_sessions: sessions.length
      },
      by_tool: byTool
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
