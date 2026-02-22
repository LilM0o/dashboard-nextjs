import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DASHBOARD_DATA_PATH = path.join(
  process.env.HOME || "/home/ubuntu",
  "clawd/workspace/dashboard/dashboard-data.json"
);

const MAX_RETRIES = 3;
const RETRY_DELAY = 100;

async function readDataWithRetry(): Promise<{ cpuHistory: any[]; ramHistory: any[] }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const data = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      const dashboardData = JSON.parse(data);

      return {
        cpuHistory: dashboardData.cpuHistory || [],
        ramHistory: dashboardData.ramHistory || [],
      };
    } catch (error) {
      console.error(`[API /history] Attempt ${attempt}/${MAX_RETRIES} failed:`, error);

      if (attempt === MAX_RETRIES) {
        console.error("[API /history] Max retries reached, returning empty data");
        return { cpuHistory: [], ramHistory: [] };
      }

      // Attendre avant de réessayer
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
    }
  }

  return { cpuHistory: [], ramHistory: [] };
}

export async function GET() {
  try {
    const data = await readDataWithRetry();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur API /history:", error);
    return NextResponse.json({
      cpuHistory: [],
      ramHistory: [],
      error: "Erreur récupération historique"
    }, { status: 500 });
  }
}
