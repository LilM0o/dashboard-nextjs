import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Chemin base OpenClaw
const OPENCLAW_DIR = "/home/ubuntu/.openclaw";
const AGENTS_DIR = join(OPENCLAW_DIR, "agents");

interface MessageEntry {
  type: string;
  message?: {
    usage?: {
      totalTokens?: number;
      input?: number;
      output?: number;
    };
    timestamp?: number; // epoch en ms
  };
}

interface SessionData {
  sessionFile: string;
  updatedAt: number;
}

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    // Lister tous les agents
    const agents = await readdir(AGENTS_DIR);
    const sessionsData: SessionData[] = [];

    // Récupérer les métadonnées de toutes les sessions en parallèle
    const sessionsResults = await Promise.all(
      agents.map(async (agent) => {
        const sessionsJsonPath = join(AGENTS_DIR, agent, "sessions", "sessions.json");
        
        if (!existsSync(sessionsJsonPath)) {
          return [];
        }

        const content = await readFile(sessionsJsonPath, "utf-8");
        const sessions = JSON.parse(content);
        const agentSessions: SessionData[] = [];

        for (const [key, data] of Object.entries(sessions)) {
          const session = data as any;
          agentSessions.push({
            sessionFile: session.sessionFile,
            updatedAt: session.updatedAt || 0
          });
        }
        
        return agentSessions;
      })
    );
    
    // Filtrer sessions actives (7 derniers jours) et lire leurs JSONL en parallèle
    const sessionTokensResults = await Promise.all(
      sessionsData
        .filter(session => session.updatedAt >= sevenDaysAgo && session.sessionFile && existsSync(session.sessionFile))
        .map(async (session) => {
          const lines = (await readFile(session.sessionFile, "utf-8")).split("\n");
          const dateKey = new Date(session.updatedAt).toISOString().split("T")[0];
          let hasActivity = false;
          const tokensByDate: Record<string, number> = {};

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const entry: MessageEntry = JSON.parse(line);

              if (entry.type === "message" && entry.message?.usage) {
                const totalTokens = entry.message.usage.totalTokens || 
                              (entry.message.usage.input || 0) + (entry.message.usage.output || 0);
                
                if (totalTokens > 0 && entry.message.timestamp) {
                  const entryDateKey = new Date(entry.message.timestamp).toISOString().split("T")[0];
                  tokensByDate[entryDateKey] = (tokensByDate[entryDateKey] || 0) + totalTokens;
                  hasActivity = true;
                }
              }
            } catch (e) {
              // Ignorer les lignes invalides
            }
          }

          return { dateKey, hasActivity, tokensByDate };
        })
    );

    // Fusionner les résultats
    const tokensByDate: Record<string, { tokens: number; sessions: number }> = {};
    for (const result of sessionTokensResults) {
      for (const [date, tokens] of Object.entries(result.tokensByDate)) {
        if (!tokensByDate[date]) {
          tokensByDate[date] = { tokens: 0, sessions: 0 };
        }
        tokensByDate[date].tokens += tokens;
      }
      if (result.hasActivity) {
        if (!tokensByDate[result.dateKey]) {
          tokensByDate[result.dateKey] = { tokens: 0, sessions: 0 };
        }
        tokensByDate[result.dateKey].sessions += 1;
      }
    }

    // Calculer les totaux
    let totalTokens = 0;
    let totalSessions = 0;
    let totalInput = 0;
    let totalOutput = 0;
    const dailyData: { date: string; tokens: number; sessions: number }[] = [];

    // Générer les 7 derniers jours (même les jours sans activité)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      
      const data = tokensByDate[dateKey] || { tokens: 0, sessions: 0 };
      dailyData.push({
        date: dateKey,
        tokens: data.tokens,
        sessions: data.sessions
      });
      
      totalTokens += data.tokens;
      totalSessions += data.sessions;
    }

    // Estimer input/output (ratio moyen ~60/40)
    totalInput = Math.round(totalTokens * 0.6);
    totalOutput = Math.round(totalTokens * 0.4);

    // Estimer cost (moyenne glm-4.7: ~$1/1M tokens)
    const costEstimate = (totalTokens / 1_000_000) * 1.0;

    // Avg response time (basé sur 2s/1k tokens)
    const avgResponseTime = totalTokens > 0 
      ? Math.round((totalTokens / 1000) * 2 / totalSessions * 10) / 10 
      : 0;

    return NextResponse.json({
      tokens_7d: totalTokens,
      tokens_input: totalInput,
      tokens_output: totalOutput,
      cost_7d: Math.round(costEstimate * 100) / 100,
      sessions_7d: totalSessions,
      avg_response_time: avgResponseTime,
      period: "7d",
      daily: dailyData
    });
  } catch (error: any) {
    console.error("Erreur API /api/tokens:", error);
    
    return NextResponse.json({
      tokens_7d: 0,
      tokens_input: 0,
      tokens_output: 0,
      cost_7d: 0,
      sessions_7d: 0,
      avg_response_time: 0,
      period: "7d",
      daily: [],
      error: error?.message || "Erreur récupération tokens"
    }, { status: 500 });
  }
}
