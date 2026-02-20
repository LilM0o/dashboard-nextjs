import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Métriques système en temps réel
    const [cpuResult, ramResult, diskResult, uptimeResult] = await Promise.all([
      execAsync("top -bn1 | grep '%Cpu(s):' | awk '{print 100 - $8}' | cut -d'.' -f1").catch(() => ({ stdout: "0" })),
      execAsync("free | grep Mem | awk '{printf(\"%.0f\", ($3/$2) * 100.0)}'").catch(() => ({ stdout: "0" })),
      execAsync("df / | tail -1 | awk '{print $5}' | cut -d'%' -f1").catch(() => ({ stdout: "0" })),
      execAsync("uptime -p").catch(() => ({ stdout: "up unknown" }))
    ]);

    const cpu = parseFloat(cpuResult.stdout) || 0;
    const ram = parseInt(ramResult.stdout) || 0;
    const disk = parseInt(diskResult.stdout) || 0;
    const uptime = uptimeResult.stdout.trim().replace(/^up /, "") || "--";

    // Statut OpenClaw
    let openclawStatus = "unknown";
    try {
      const { stdout } = await execAsync("openclaw status --json");
      const status = JSON.parse(stdout);
      openclawStatus = status.status === "running" ? "online" : "offline";
    } catch (e) {
      openclawStatus = "offline";
    }

    // Statut Tailscale
    let tailscaleStatus = "unknown";
    try {
      const { stdout } = await execAsync("tailscale status --json 2>/dev/null | head -1 | jq -r '.BackendState' 2>/dev/null || echo 'offline'");
      tailscaleStatus = stdout.trim() || "offline";
    } catch (e) {
      tailscaleStatus = "disconnected";
    }

    return NextResponse.json({
      cpu,
      ram,
      disk,
      uptime,
      openclaw_status: openclawStatus,
      tailscale_status: tailscaleStatus
    });
  } catch (error: any) {
    console.error("Erreur API /api/system:", error);
    return NextResponse.json({
      cpu: 0,
      ram: 0,
      disk: 0,
      uptime: "--",
      openclaw_status: "error",
      tailscale_status: "error"
    }, { status: 500 });
  }
}
