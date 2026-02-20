import { NextResponse } from "next/server";
import fs from "fs/promises";
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
    // Essayer d'abord depuis openclaw cron list
    let heartbeatsFromOpenClaw: any[] = [];
    let useOpenClaw = false;
    
    try {
      const { stdout } = await execAsync("openclaw cron list --json");
      const cronData = JSON.parse(stdout);
      
      if (cronData.jobs && Array.isArray(cronData.jobs)) {
        // Filtrer les heartbeats
        heartbeatsFromOpenClaw = cronData.jobs
          .filter((job: any) => job.name && job.name.toLowerCase().includes("heartbeat"))
          .map((job: any) => ({
            name: job.name,
            schedule: job.schedule?.kind || "N/A",
            last_run: job.lastRun || job.last_run || "N/A",
            status: job.state?.lastStatus || job.status || "unknown",
            enabled: job.enabled !== false
          }));
        
        if (heartbeatsFromOpenClaw.length > 0) {
          useOpenClaw = true;
        }
      }
    } catch (e) {
      console.log("Impossible de récupérer depuis openclaw cron list:", e);
    }

    // Si on a des données depuis OpenClaw, les utiliser
    if (useOpenClaw && heartbeatsFromOpenClaw.length > 0) {
      const active = heartbeatsFromOpenClaw.filter((hb: any) => hb.enabled).length;
      return NextResponse.json({
        jobs: heartbeatsFromOpenClaw,
        active,
        total: heartbeatsFromOpenClaw.length,
        source: "openclaw"
      });
    }

    // Fallback: lire depuis le fichier dashboard-data.json
    let data: any = {};
    
    try {
      const content = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      data = JSON.parse(content);
    } catch (error) {
      // Fichier inexistant, retourner vide avec un message
      return NextResponse.json({
        jobs: [],
        active: 0,
        total: 0,
        source: "none",
        message: "Aucune donnée disponible"
      });
    }

    // Extraire les heartbeats depuis les données cron
    const cronJobs = data.cron?.jobs || [];
    
    // Filtrer les heartbeats (ceux qui commencent par "heartbeat")
    const heartbeats = cronJobs
      .filter((job: any) => job.name && job.name.toLowerCase().includes("heartbeat"))
      .map((job: any) => ({
        name: job.name,
        schedule: job.schedule || "N/A",
        last_run: job.last_run || "N/A",
        status: job.status || "unknown",
        enabled: job.enabled !== false
      }));

    const active = heartbeats.filter((hb: any) => hb.enabled).length;

    return NextResponse.json({
      jobs: heartbeats,
      active,
      total: heartbeats.length,
      source: "file"
    });
  } catch (error: any) {
    console.error("Erreur API /api/heartbeats:", error);
    
    return NextResponse.json({
      jobs: [],
      active: 0,
      total: 0,
      error: "Erreur récupération heartbeats"
    }, { status: 500 });
  }
}
