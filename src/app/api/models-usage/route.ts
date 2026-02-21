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
    model?: string;
    modelProvider?: string;
    timestamp?: number;
  };
}

interface SessionData {
  sessionFile: string;
  updatedAt: number;
  model?: string;
}

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    // Lister tous les agents
    const agents = await readdir(AGENTS_DIR);
    const sessionsData: SessionData[] = [];

    // Récupérer les métadonnées de toutes les sessions
    for (const agent of agents) {
      const sessionsJsonPath = join(AGENTS_DIR, agent, "sessions", "sessions.json");
      
      if (!existsSync(sessionsJsonPath)) {
        continue;
      }

      const content = await readFile(sessionsJsonPath, "utf-8");
      const sessions = JSON.parse(content);

      for (const [key, data] of Object.entries(sessions)) {
        const session = data as any;
        sessionsData.push({
          sessionFile: session.sessionFile,
          updatedAt: session.updatedAt || 0,
          model: session.model || session.modelProvider || "unknown"
        });
      }
    }

    // Agréger par modèle depuis les JSONL
    const models: Record<string, { input_tokens: number; output_tokens: number; count: number }> = {};

    // Parcourir les sessions actives (7 derniers jours)
    for (const session of sessionsData) {
      if (session.updatedAt < sevenDaysAgo) {
        continue;
      }

      if (!existsSync(session.sessionFile)) {
        continue;
      }

      // Lire le JSONL ligne par ligne
      const lines = (await readFile(session.sessionFile, "utf-8")).split("\n");

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry: MessageEntry = JSON.parse(line);

          // Extraire les tokens et le modèle des messages
          if (entry.type === "message" && entry.message?.usage) {
            const inputTokens = entry.message.usage.input || 0;
            const outputTokens = entry.message.usage.output || 0;
            const totalTokens = entry.message.usage.totalTokens || (inputTokens + outputTokens);

            // Extraire le modèle depuis le message ou la session
            const model = entry.message.model || (session as any).model || "unknown";

            if (totalTokens > 0) {
              if (!models[model]) {
                models[model] = { input_tokens: 0, output_tokens: 0, count: 0 };
              }

              models[model].input_tokens += inputTokens;
              models[model].output_tokens += outputTokens;
              models[model].count += 1;
            }
          }
        } catch (e) {
          // Ignorer les lignes invalides
        }
      }
    }

    // Calculer total tokens et sessions
    let totalTokens = 0;
    let totalSessions = 0;
    
    const modelUsage = Object.entries(models)
      .map(([model, data]) => {
        const total = data.input_tokens + data.output_tokens;
        totalTokens += total;
        totalSessions += data.count;

        return {
          model,
          input_tokens: data.input_tokens,
          output_tokens: data.output_tokens,
          total_tokens: total,
          count: data.count
        };
      })
      .sort((a, b) => b.total_tokens - a.total_tokens)
      .slice(0, 10); // Top 10 modèles

    return NextResponse.json({
      models: modelUsage,
      total_tokens: totalTokens,
      total_sessions: totalSessions
    });
  } catch (error: any) {
    console.error("Erreur API /api/models-usage:", error);
    
    return NextResponse.json({
      models: [],
      total_tokens: 0,
      total_sessions: 0,
      error: "Erreur récupération modèles"
    }, { status: 500 });
  }
}
