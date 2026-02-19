import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const DASHBOARD_DATA_PATH = path.join(
  process.env.HOME || "/home/ubuntu",
  "clawd/workspace/dashboard/dashboard-data.json"
);

export async function GET() {
  try {
    // Récupérer les données du fichier JSON
    let cronData = { status: "OK", recentExecutions: 0 };

    try {
      const data = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      const dashboardData = JSON.parse(data);
      cronData = dashboardData.cron ?? cronData;
    } catch (error) {
      console.error("Erreur lecture dashboard-data.json:", error);
    }

    // Récupérer la liste des crons via openclaw cron list
    let jobs = [];
    let total = 0;
    let active = 0;

    try {
      const { stdout } = await execAsync("openclaw cron list --json");
      const cronList = JSON.parse(stdout);

      jobs = (cronList.jobs || []).map((job: any) => ({
        name: job.name || "Unknown",
        schedule: job.schedule?.kind || "unknown",
        status: job.enabled ? "enabled" : "disabled",
        last_status: job.lastStatus || "unknown",
        enabled: job.enabled ?? false,
      }));

      total = jobs.length;
      active = jobs.filter((job: any) => job.enabled).length;
    } catch (error) {
      console.error("Erreur récupération crons:", error);
      // Fallback : utiliser les données du fichier
      jobs = [
        {
          name: "dashboard-data",
          schedule: "every",
          status: "enabled",
          last_status: cronData.status === "OK" ? "ok" : "error",
          enabled: true,
        },
      ];
      total = 1;
      active = 1;
    }

    return NextResponse.json({
      jobs,
      total,
      active,
    });
  } catch (error) {
    console.error("Erreur API /api/cron:", error);
    return NextResponse.json(
      {
        jobs: [],
        total: 0,
        active: 0,
        error: "Erreur récupération cron jobs",
      },
      { status: 500 }
    );
  }
}
