import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "../../workspace/dashboard/dashboard-data.json");
    const jsonData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(jsonData);
    
    return NextResponse.json({
      cpu: data.system?.cpu?.usage_percent ?? 0,
      ram: data.system?.ram?.usage_percent ?? 0,
      disk: data.system?.disk?.usage_percent ?? 0,
      uptime: data.system?.uptime?.text ?? "--",
      openclaw_status: data.system?.openclaw?.status ?? "unknown",
      tailscale_status: data.system?.tailscale?.status ?? "unknown"
    });
  } catch (error: any) {
    // Return mock data if file not found
    return NextResponse.json({
      cpu: Math.floor(Math.random() * 30) + 5,
      ram: Math.floor(Math.random() * 40) + 20,
      disk: 27,
      uptime: "13j 20h",
      openclaw_status: "active",
      tailscale_status: "connected"
    });
  }
}
