import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Récupérer toutes les sessions
    const { stdout } = await execAsync("openclaw sessions list --json");
    const sessionsData = JSON.parse(stdout);
    const sessions = sessionsData.sessions || [];

    // Filtrer sur les 7 derniers jours
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Grouper les tokens par date
    const tokensByDate: Record<string, { tokens: number; sessions: number }> = {};

    sessions.forEach((session: any) => {
      const updatedAt = session.updatedAt ? new Date(session.updatedAt) : null;
      
      if (updatedAt && updatedAt >= sevenDaysAgo) {
        const dateKey = updatedAt.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!tokensByDate[dateKey]) {
          tokensByDate[dateKey] = { tokens: 0, sessions: 0 };
        }
        
        // OpenClaw retourne inputTokens, outputTokens, totalTokens - attention aux null!
        const inputTokens = session.inputTokens ?? 0;
        const outputTokens = session.outputTokens ?? 0;
        const tokens = session.totalTokens ?? (inputTokens + outputTokens);
        
        if (tokens > 0) {
          tokensByDate[dateKey].tokens += tokens;
          tokensByDate[dateKey].sessions += 1;
        }
      }
    });

    // Calculer les totaux
    let totalTokens = 0;
    let totalSessions = 0;
    const dailyData: { date: string; tokens: number; sessions: number }[] = [];

    // Générer les 7 derniers jours (mêmeles jours sans activité)
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      const data = tokensByDate[dateKey] || { tokens: 0, sessions: 0 };
      dailyData.push({
        date: dateKey,
        tokens: data.tokens,
        sessions: data.sessions
      });
      
      totalTokens += data.tokens;
      totalSessions += data.sessions;
    }

    // Estimer cost (moyenne glm-4.7: ~$1/1M tokens)
    const costEstimate = (totalTokens / 1_000_000) * 1.0;

    // Calculer avg response time (estimé basé sur ageMs moyen)
    const avgAgeMs = sessions.length > 0
      ? sessions.reduce((sum: number, s: any) => sum + (s.ageMs || 0), 0) / sessions.length
      : 0;
    const avgResponseTime = Math.round(avgAgeMs / 1000 * 10) / 10; // en secondes

    return NextResponse.json({
      tokens_7d: totalTokens,
      tokens_input: Math.round(totalTokens * 0.6), // Estimation 60% input
      tokens_output: Math.round(totalTokens * 0.4), // Estimation 40% output
      cost_7d: Math.round(costEstimate * 100) / 100,
      sessions_7d: totalSessions,
      avg_response_time: avgResponseTime,
      period: "7d",
      daily: dailyData
    });
  } catch (error: any) {
    console.error("Erreur API /api/tokens:", error);
    
    // Fallback sécurisé (pas de mock data gigante)
    return NextResponse.json({
      tokens_7d: 0,
      tokens_input: 0,
      tokens_output: 0,
      cost_7d: 0,
      sessions_7d: 0,
      avg_response_time: 0,
      period: "7d",
      daily: [],
      error: "Erreur récupération tokens"
    }, { status: 500 });
  }
}
