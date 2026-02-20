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

    // Agréger par modèle
    const models: Record<string, { input_tokens: number; output_tokens: number; count: number }> = {};

    sessions.forEach((session: any) => {
      const model = session.model || "unknown";
      const inputTokens = session.inputTokens ?? 0;
      const outputTokens = session.outputTokens ?? 0;

      if (!models[model]) {
        models[model] = { input_tokens: 0, output_tokens: 0, count: 0 };
      }

      models[model].input_tokens += inputTokens;
      models[model].output_tokens += outputTokens;
      models[model].count += 1;
    });

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