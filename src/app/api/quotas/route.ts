import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "../../workspace/dashboard/dashboard-data.json");
    const jsonData = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(jsonData);
    
    return NextResponse.json({
      zai: {
        used: 95,
        total: 100,
        percent: 95
      },
      minimax: {
        used: 45,
        total: 100,
        percent: 45
      },
      openrouter: {
        used: 30,
        total: 100,
        percent: 30
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      zai: { used: 95, total: 100, percent: 95 },
      minimax: { used: 45, total: 100, percent: 45 },
      openrouter: { used: 30, total: 100, percent: 30 }
    });
  }
}
