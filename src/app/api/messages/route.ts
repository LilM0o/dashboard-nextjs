import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COMMANDS_LOG = "/home/ubuntu/.openclaw/logs/commands.log";

export async function GET() {
  try {
    // Lire le fichier commands.log
    if (!fs.existsSync(COMMANDS_LOG)) {
      return NextResponse.json({
        messages_today: 0,
        messages_7d: 0,
        daily: [],
        sources: {}
      });
    }

    const content = fs.readFileSync(COMMANDS_LOG, "utf-8");
    const lines = content.trim().split("\n").filter(line => line.length > 0);

    // Parser chaque ligne JSON
    const messages: { timestamp: string; action: string; source: string }[] = [];
    
    lines.forEach(line => {
      try {
        const entry = JSON.parse(line);
        if (entry.action === "new" || entry.action === "message") {
          messages.push({
            timestamp: entry.timestamp,
            action: entry.action,
            source: entry.source || "unknown"
          });
        }
      } catch (e) {
        // Ignorer les lignes invalides
      }
    });

    // Grouper par date
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const messagesByDate: Record<string, number> = {};
    const sourcesByDate: Record<string, Record<string, number>> = {};

    messages.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      
      // Compter tous les messages (historique complet)
      const dateKey = msgDate.toISOString().split('T')[0];
      
      if (!messagesByDate[dateKey]) {
        messagesByDate[dateKey] = 0;
        sourcesByDate[dateKey] = {};
      }
      
      messagesByDate[dateKey]++;
      
      const source = msg.source || "unknown";
      if (!sourcesByDate[dateKey][source]) {
        sourcesByDate[dateKey][source] = 0;
      }
      sourcesByDate[dateKey][source]++;
    });

    // Générer les 7 derniers jours
    const daily: { date: string; day: string; count: number; sources: Record<string, number> }[] = [];
    let messages7d = 0;
    let messagesToday = 0;
    const todayKey = now.toISOString().split('T')[0];

    const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = DAYS_FR[date.getDay()];
      
      const count = messagesByDate[dateKey] || 0;
      daily.push({
        date: dateKey,
        day: dayName,
        count,
        sources: sourcesByDate[dateKey] || {}
      });
      
      messages7d += count;
      if (dateKey === todayKey) {
        messagesToday = count;
      }
    }

    // Compter par source
    const sources: Record<string, number> = {};
    messages.forEach(msg => {
      const source = msg.source || "unknown";
      sources[source] = (sources[source] || 0) + 1;
    });

    return NextResponse.json({
      messages_today: messagesToday,
      messages_7d: messages7d,
      total_messages: messages.length,
      daily,
      sources
    });
  } catch (error: any) {
    console.error("Erreur API /api/messages:", error);
    
    return NextResponse.json({
      messages_today: 0,
      messages_7d: 0,
      total_messages: 0,
      daily: [],
      sources: {},
      error: "Erreur récupération messages"
    }, { status: 500 });
  }
}
