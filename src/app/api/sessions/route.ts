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

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    // Lister tous les agents
    const agents = await readdir(AGENTS_DIR);
    const sessionsList: any[] = [];

    // Pour chaque agent, lire les sessions
    for (const agent of agents) {
      const sessionsJsonPath = join(AGENTS_DIR, agent, "sessions", "sessions.json");
      
      if (!existsSync(sessionsJsonPath)) {
        continue;
      }

      const content = await readFile(sessionsJsonPath, "utf-8");
      const sessions = JSON.parse(content);

      for (const [sessionKey, data] of Object.entries(sessions)) {
        const session = data as any;
        
        // Filtrer sessions actives (7 derniers jours)
        if (session.updatedAt && session.updatedAt < sevenDaysAgo) {
          continue;
        }

        // Calculer les totaux depuis le JSONL
        let totalTokens = 0;
        let totalMessages = 0;
        let sessionFile = session.sessionFile;

        if (sessionFile && existsSync(sessionFile)) {
          const lines = (await readFile(sessionFile, "utf-8")).split("\n");

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const entry: MessageEntry = JSON.parse(line);

              if (entry.type === "message" && entry.message?.usage) {
                const tokens = entry.message.usage.totalTokens || 
                              (entry.message.usage.input || 0) + (entry.message.usage.output || 0);
                
                if (tokens > 0) {
                  totalTokens += tokens;
                  totalMessages++;
                }
              }
            } catch (e) {
              // Ignorer les lignes invalides
            }
          }
        }

        sessionsList.push({
          id: session.sessionId || sessionKey,
          key: sessionKey,
          agent: agent,
          model: session.model || session.modelProvider || "unknown",
          chatType: session.chatType || "unknown",
          totalTokens,
          totalMessages,
          updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : null,
          lastChannel: session.lastChannel || "unknown"
        });
      }
    }

    // Trier par updatedAt (plus récent en premier)
    sessionsList.sort((a, b) => {
      if (!a.updatedAt) return 1;
      if (!b.updatedAt) return -1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Limiter aux 50 sessions les plus récentes
    const recentSessions = sessionsList.slice(0, 50);

    // Calculer les totaux globaux
    const globalTotals = recentSessions.reduce((acc, s) => ({
      totalTokens: acc.totalTokens + (s.totalTokens || 0),
      totalMessages: acc.totalMessages + (s.totalMessages || 0),
      activeSessions: acc.activeSessions + (s.totalTokens > 0 ? 1 : 0)
    }), { totalTokens: 0, totalMessages: 0, activeSessions: 0 });

    return NextResponse.json({
      sessions: recentSessions,
      stats: {
        total: sessionsList.length,
        active: globalTotals.activeSessions,
        totalTokens: globalTotals.totalTokens,
        totalMessages: globalTotals.totalMessages,
        period: "7d"
      }
    });
  } catch (error: any) {
    console.error("Erreur API /api/sessions:", error);
    
    return NextResponse.json({
      sessions: [],
      stats: {
        total: 0,
        active: 0,
        totalTokens: 0,
        totalMessages: 0,
        period: "7d"
      },
      error: error?.message || "Erreur récupération sessions"
    }, { status: 500 });
  }
}
