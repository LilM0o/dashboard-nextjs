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
    // Récupérer les métriques système en temps réel
    const cpu = await getCpuUsage();
    const ram = await getRamUsage();
    const disk = await getDiskUsage();
    const uptime = await getUptime();

    // Récupérer les données du dashboard pour l'uptime
    let dashboardUptime = "--";
    try {
      const data = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
      const dashboardData = JSON.parse(data);
      dashboardUptime = dashboardData.system?.uptime || uptime;
    } catch (error) {
      dashboardUptime = uptime;
    }

    return NextResponse.json({
      cpu,
      ram,
      disk,
      uptime: dashboardUptime,
      openclaw_status: "online",
      tailscale_status: "online",
    });
  } catch (error) {
    console.error("Erreur API /api/system:", error);
    return NextResponse.json(
      {
        cpu: 0,
        ram: 0,
        disk: 0,
        uptime: "--",
        openclaw_status: "unknown",
        tailscale_status: "unknown",
      },
      { status: 500 }
    );
  }
}

async function getCpuUsage(): Promise<number> {
  try {
    const { stdout } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
    return parseFloat(stdout) || 0;
  } catch {
    return 0;
  }
}

async function getRamUsage(): Promise<number> {
  try {
    const { stdout } = await execAsync("free | grep Mem | awk '{printf(\"%.0f\", ($3/$2) * 100.0)}'");
    return parseInt(stdout) || 0;
  } catch {
    return 0;
  }
}

async function getDiskUsage(): Promise<number> {
  try {
    const { stdout } = await execAsync("df / | tail -1 | awk '{print $5}' | cut -d'%' -f1");
    return parseInt(stdout) || 0;
  } catch {
    return 0;
  }
}

async function getUptime(): Promise<string> {
  try {
    const { stdout } = await execAsync("uptime -p");
    return stdout.trim() || "--";
  } catch {
    return "--";
  }
}
