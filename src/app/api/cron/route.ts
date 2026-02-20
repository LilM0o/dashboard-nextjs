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
    // Récupérer les données du fichier JSON pour info
    let cronFileData = { status: "OK", recentExecutions: 0 };

    try {
      const data = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      const dashboardData = JSON.parse(data);
      cronFileData = dashboardData.cron ?? cronFileData;
    } catch (error) {
      // Fichier inexistant, c'est OK
    }

    // Récupérer la liste des crons via openclaw cron list
    let jobs: any[] = [];
    let total = 0;
    let active = 0;
    let source = "openclaw";

    try {
      const { stdout, stderr } = await execAsync("openclaw cron list --json");
      
      if (stderr) {
        console.error("Cron list stderr:", stderr);
      }
      
      const cronList = JSON.parse(stdout);

      if (cronList.jobs && Array.isArray(cronList.jobs)) {
        jobs = cronList.jobs.map((job: any) => ({
          name: job.name || "Unknown",
          schedule: job.schedule?.kind || job.schedule || "unknown",
          status: job.enabled ? "enabled" : "disabled",
          last_status: job.state?.lastStatus || job.lastStatus || "unknown",
          enabled: job.enabled ?? false,
        }));

        total = jobs.length;
        active = jobs.filter((job: any) => job.enabled).length;
      } else {
        throw new Error("Format de réponse inattendu");
      }
    } catch (error) {
      console.error("Erreur récupération crons depuis openclaw:", error);
      
      // Fallback : utiliser les données du fichier ou données statiques
      source = "file";
      jobs = [
        {
          name: "dashboard-data",
          schedule: "hourly",
          status: "enabled",
          last_status: cronFileData.status === "OK" ? "ok" : "error",
          enabled: true,
        },
        {
          name: "heartbeat-matin",
          schedule: "daily",
          status: "enabled",
          last_status: "unknown",
          enabled: true,
        },
        {
          name: "heartbeat-soir",
          schedule: "daily",
          status: "enabled",
          last_status: "unknown",
          enabled: true,
        }
      ];
      total = jobs.length;
      active = jobs.filter((job: any) => job.enabled).length;
    }

    return NextResponse.json({
      jobs,
      total,
      active,
      source,
      file_status: cronFileData.status
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
