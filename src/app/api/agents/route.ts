import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Fonction pour extraire l'agent depuis le key ou sessionKey
function extractAgentId(session: any): string {
  // Essayer agentId direct
  if (session.agentId) return session.agentId;
  
  // Extraire depuis le key (format: agent:main:discord:channel:xxx)
  const key = session.key || session.sessionKey || "";
  if (key.includes("agent:")) {
    const parts = key.split(":");
    // agent:main:... -> "main"
    // agent:web-researcher:... -> "web-researcher"
    if (parts.length >= 2) {
      return parts[1];
    }
  }
  
  // Fallback
  return "main";
}

// Fonction pour extraire le nom de la session depuis le key
function extractSessionName(session: any): string {
  // Utiliser le label si disponible
  if (session.label) return session.label;
  
  // Extraire depuis le key
  const key = session.key || session.sessionKey || "";
  if (key) {
    // Essayer d'extraire des infos utiles
    const parts = key.split(":");
    if (parts.length >= 3) {
      // agent:main:discord:channel:xxx -> discord/xxx
      const channelType = parts[2]; // discord, telegram, etc.
      const channelId = parts[4] || "";
      return `${channelType}/${channelId.slice(0, 8)}`;
    }
  }
  
  return "Session";
}

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
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10) // Garder les 10 plus récentes
      .map((session: any) => ({
        id: session.sessionKey || session.id || session.key,
        name: extractSessionName(session),
        agentId: extractAgentId(session),
        status: session.status || "unknown",
        lastActivity: session.updatedAt ? new Date(session.updatedAt).toISOString() : new Date().toISOString(),
        tokens: { 
          input: session.inputTokens || 0, 
          output: session.outputTokens || 0, 
          total: session.totalTokens || (session.inputTokens || 0) + (session.outputTokens || 0) 
        },
        model: session.model || "unknown",
        messagesCount: session.messagesCount || 0,
        createdAt: session.createdAt || session.updatedAt || new Date().toISOString()
      }));

    // Calculer les KPIs
    const activeSessions = sessions.filter((s: any) => s.status === "active").length;
    const totalTokens = sessions.reduce((sum: number, s: any) => {
      const tokens = s.totalTokens || ((s.inputTokens || 0) + (s.outputTokens || 0));
      return sum + tokens;
    }, 0);
    const totalMessages = sessions.reduce((sum: number, s: any) => sum + (s.messagesCount || 0), 0);

    // Agréger par agent et par source (depuis le key)
    const agents: Record<string, { count: number; successRate: number; avgLatency: number; sessions: any[] }> = {};
    const sources: Record<string, { count: number; successRate: number; avgLatency: number; sessions: any[] }> = {};

    sessions.forEach((session: any) => {
      const agentId = extractAgentId(session);
      if (!agents[agentId]) {
        agents[agentId] = { count: 0, successRate: 0, avgLatency: 0, sessions: [] };
      }

      agents[agentId].count++;
      agents[agentId].sessions.push(session);
      agents[agentId].avgLatency += (session.ageMs || 0);

      // Extraire la source depuis le key (discord, telegram, etc.)
      const key = session.key || "";
      const sourceMatch = key.match(/:([^:]+):channel:/);
      const source = sourceMatch ? sourceMatch[1] : "unknown";
      
      if (!sources[source]) {
        sources[source] = { count: 0, successRate: 0, avgLatency: 0, sessions: [] };
      }
      sources[source].count++;
      sources[source].sessions.push(session);
      sources[source].avgLatency += (session.ageMs || 0);
    });

    // Calculer success rate par agent
    Object.keys(agents).forEach(agentId => {
      const agent = agents[agentId];
      const completedSessions = agent.sessions.filter((s: any) => s.status === "completed").length;
      const totalSessionsCount = agent.sessions.filter((s: any) => s.status === "completed" || s.status === "active").length;
      agent.successRate = totalSessionsCount > 0 ? (completedSessions / totalSessionsCount) * 100 : 100;
      agent.avgLatency = agent.count > 0 ? Math.round(agent.avgLatency / agent.count) : 0;
    });

    // Calculer success rate par source
    Object.keys(sources).forEach(source => {
      const sourceData = sources[source];
      const completedSessions = sourceData.sessions.filter((s: any) => s.status === "completed").length;
      const totalSessionsCount = sourceData.sessions.filter((s: any) => s.status === "completed" || s.status === "active").length;
      sourceData.successRate = totalSessionsCount > 0 ? (completedSessions / totalSessionsCount) * 100 : 100;
      sourceData.avgLatency = sourceData.count > 0 ? Math.round(sourceData.avgLatency / sourceData.count) : 0;
    });

    // Trier les agents par nombre d'appels
    const byAgent = Object.entries(agents)
      .map(([agentId, data]) => ({
        agentId,
        tool_name: agentId,
        count: data.count,
        success_rate: Math.round(data.successRate),
        avg_latency_ms: data.avgLatency
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 agents

    // Trier les sources par nombre d'appels
    const bySource = Object.entries(sources)
      .map(([source, data]) => ({
        source,
        tool_name: source,
        count: data.count,
        success_rate: Math.round(data.successRate),
        avg_latency_ms: data.avgLatency
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 sources

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
      by_skill: bySource // Renommé pour refléter qu'on affiche les sources
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
