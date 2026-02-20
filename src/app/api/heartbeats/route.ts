import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DASHBOARD_DATA_PATH = path.join(
  process.env.HOME || "/home/ubuntu",
  "clawd/workspace/dashboard/dashboard-data.json"
);

export async function GET() {
  try {
    // Lire le fichier de données
    let data: any = {};
    
    try {
      const content = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      data = JSON.parse(content);
    } catch (error) {
      // Fichier inexistant, retourner vide
      return NextResponse.json({
        jobs: [],
        active: 0,
        total: 0
      });
    }

    // Extraire les heartbeats depuis les données cron
    const cronJobs = data.cron?.jobs || [];
    
    // Filtrer les heartbeats (ceux qui commencent par "heartbeat")
    const heartbeats = cronJobs
      .filter((job: any) => job.name.toLowerCase().includes("heartbeat"))
      .map((job: any) => ({
        name: job.name,
        schedule: job.schedule || "N/A",
        last_run: job.last_run || "N/A",
        status: job.status || "unknown",
        enabled: job.enabled !== false
      }));

    const active = heartbeats.filter((hb: any) => hb.enabled).length;
    const total = heartbeats.length;

    return NextResponse.json({
      jobs: heartbeats,
      active,
      total
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