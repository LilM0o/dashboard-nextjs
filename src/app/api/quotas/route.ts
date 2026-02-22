import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Coûts par million de tokens (USD)
const COSTS_PER_1M = {
  zai: { input: 0.60, output: 1.20 },
  minimax: { input: 15.0, output: 60.0 }
};

// Budgets mensuels (USD)
const BUDGET_MONTHLY = {
  zai: 50.0,
  minimax: 30.0
};

// Mapping des modèles aux providers
const MODEL_TO_PROVIDER: Record<string, "zai" | "minimax"> = {
  // Modèles avec préfixe (existants)
  "zai/glm-4.7": "zai",
  "zai/glm-4.7-flash": "zai",
  "zai/glm-4.5-air": "zai",
  "z-ai/glm-4.5-air": "zai",
  "minimax/MiniMax-M2.5": "minimax",
  "minimax/mini-max": "minimax",
  "minimax/minimax-m2.1": "minimax",
  "openrouter/minimax/minimax-m2.1": "minimax",
  // Modèles sans préfixe (ajoutés - vus dans openclaw sessions list)
  "glm-4.7": "zai",
  "glm-4.7-flash": "zai",
  "glm-4.5-air": "zai",
  "MiniMax-M2.5": "minimax",
  "MiniMax M2.5": "minimax",
  "minimax-m2.1": "minimax"
};

export async function GET() {
  try {
    // Récupérer les sessions depuis OpenClaw
    const { stdout, stderr } = await execAsync("openclaw sessions list --json");

    if (stderr) {
      console.error("Erreur stderr sessions list:", stderr);
    }

    const sessionsData = JSON.parse(stdout);
    const sessions = sessionsData.sessions || [];

    // Agréger les tokens par provider
    const providerTokens: Record<string, { input: number; output: number }> = {
      zai: { input: 0, output: 0 },
      minimax: { input: 0, output: 0 }
    };

    let totalSessions = 0;

    sessions.forEach((session: any) => {
      totalSessions++;

      const model = session.model || "";
      // OpenClaw retourne inputTokens, outputTokens, totalTokens - attention aux null!
      const inputTokens = session.inputTokens ?? 0;
      const outputTokens = session.outputTokens ?? 0;
      const totalTokens = session.totalTokens ?? (inputTokens + outputTokens);
      const provider = MODEL_TO_PROVIDER[model];

      if (provider && providerTokens[provider] && totalTokens > 0) {
        providerTokens[provider].input += inputTokens;
        providerTokens[provider].output += outputTokens;
      }
    });

    // Calculer les coûts estimés et les pourcentages
    const quotas = Object.entries(providerTokens)
      .map(([provider, tokens]) => {
        const costs = COSTS_PER_1M[provider as keyof typeof COSTS_PER_1M];
        const budget = BUDGET_MONTHLY[provider as keyof typeof BUDGET_MONTHLY];

        if (!costs || !budget) {
          return null;
        }

        const totalTokens = tokens.input + tokens.output;
        const costInput = (tokens.input / 1_000_000) * costs.input;
        const costOutput = (tokens.output / 1_000_000) * costs.output;
        const costEstimated = costInput + costOutput;

        const percentUsed = (costEstimated / budget) * 100;

        // Déterminer le statut
        let status = "ok";
        if (percentUsed > 90) status = "critical";
        else if (percentUsed > 70) status = "warning";

        return {
          provider,
          model: provider === "zai" ? "glm-4.7" : "MiniMax-M2.5",
          tokens_input: tokens.input,
          tokens_output: tokens.output,
          total_tokens: totalTokens,
          cost_estimated: Math.round(costEstimated * 100) / 100, // 2 décimales
          budget_monthly: budget,
          percent_used: Math.round(percentUsed * 10) / 10, // 1 décimale
          status
        };
      })
      .filter((quota) => quota !== null)
      .sort((a, b) => (b?.cost_estimated || 0) - (a?.cost_estimated || 0));

    return NextResponse.json({
      quotas,
      total_sessions: totalSessions,
      generated_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Erreur API /api/quotas:", error);

    // Fallback : quotas vides
    return NextResponse.json({
      quotas: [],
      total_sessions: 0,
      error: "Erreur récupération quotas"
    }, { status: 500 });
  }
}
