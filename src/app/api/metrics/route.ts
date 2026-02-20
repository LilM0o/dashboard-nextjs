import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(process.env.HOME || "/home/ubuntu", "clawd/workspace/dashboard/dashboard-data.json");
    const logsPath = path.join(process.env.HOME || "/home/ubuntu", ".openclaw/logs/commands.log");
    
    // Lire les données du dashboard
    let dashboardData: any = {};
    try {
      const jsonData = fs.readFileSync(dataPath, "utf-8");
      dashboardData = JSON.parse(jsonData);
    } catch (error) {
      // Fichier inexistant
    }
    
    const metrics = dashboardData.metrics ?? {};
    
    // Lire les logs pour extraire les erreurs et timeouts
    let errorDetails: any[] = [];
    let timeoutDetails: any[] = [];
    let errorsCount = metrics.errors_24h ?? 0;
    let timeoutsCount = metrics.timeouts_24h ?? 0;
    
    try {
      if (fs.existsSync(logsPath)) {
        const logsContent = fs.readFileSync(logsPath, "utf-8");
        const lines = logsContent.trim().split("\n").filter((line) => line.length > 0);
        
        // Analyser les 100 dernières lignes
        const recentLines = lines.slice(-100);
        
        recentLines.forEach((line) => {
          try {
            const entry = JSON.parse(line);
            
            if (entry.action === "error") {
              errorsCount++;
              errorDetails.push({
                id: `error-${entry.timestamp || Date.now()}`,
                type: "error",
                message: entry.message || entry.error || "Erreur inconnue",
                timestamp: entry.timestamp || new Date().toISOString(),
                category: "System",
                severity: "medium"
              });
            }
            
            if (entry.action === "timeout" || (entry.error && entry.error.includes("timeout"))) {
              timeoutsCount++;
              timeoutDetails.push({
                id: `timeout-${entry.timestamp || Date.now()}`,
                type: "timeout",
                message: entry.message || "Timeout inconnu",
                timestamp: entry.timestamp || new Date().toISOString(),
                category: "Performance",
                severity: "low"
              });
            }
          } catch (e) {
            // Ignorer les lignes invalides
          }
        });
        
        // Garder seulement les 10 dernières erreurs/timeout
        errorDetails = errorDetails.slice(-10).reverse();
        timeoutDetails = timeoutDetails.slice(-10).reverse();
      }
    } catch (error) {
      console.error("Erreur lecture logs:", error);
    }
    
    // Fusionner les détails des erreurs et timeouts
    const allErrorDetails = [...errorDetails, ...timeoutDetails].slice(0, 10);
    
    return NextResponse.json({
      messages_today: metrics.messages_today ?? 0,
      errors_24h: errorsCount,
      timeouts_24h: timeoutsCount,
      restarts_24h: metrics.restarts_24h ?? 0,
      log_lines_24h: metrics.log_lines_24h ?? 0,
      total_conversations: metrics.total_conversations_today ?? 0,
      error_details: allErrorDetails,
      timeout_details: timeoutDetails
    });
  } catch (error: any) {
    console.error("Erreur API /api/metrics:", error);
    
    // Fallback en cas d'erreur
    return NextResponse.json({
      messages_today: 0,
      errors_24h: 0,
      timeouts_24h: 0,
      restarts_24h: 0,
      log_lines_24h: 0,
      total_conversations: 0,
      error_details: [],
      timeout_details: []
    }, { status: 500 });
  }
}