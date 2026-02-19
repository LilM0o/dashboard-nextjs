import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const DASHBOARD_DATA_PATH = path.join(
  process.env.HOME || "/home/ubuntu",
  "clawd/workspace/dashboard/dashboard-data.json"
);

export async function GET() {
  try {
    // Lire le fichier de données
    const data = await fs.readFile(DASHBOARD_DATA_PATH, "utf-8");
    const dashboardData = JSON.parse(data);

    // Retourner les données historiques
    return NextResponse.json({
      cpuHistory: dashboardData.cpuHistory || [],
      ramHistory: dashboardData.ramHistory || [],
    });
  } catch (error) {
    console.error("Erreur lecture dashboard-data.json:", error);
    // Retourner des données vides si le fichier n'existe pas
    return NextResponse.json({
      cpuHistory: [],
      ramHistory: [],
    });
  }
}
