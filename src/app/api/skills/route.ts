import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Chemin base OpenClaw
const OPENCLAW_DIR = "/home/ubuntu/.openclaw";
const AGENTS_DIR = join(OPENCLAW_DIR, "agents");

interface MessageEntry {
  type: string;
  message?: {
    content?: Array<{
      type: string;
      text?: string;
      toolCall?: {
        name?: string;
      };
    }>;
    role?: string;
  };
}

interface SkillUsage {
  skill: string;
  count: number;
  tokens: number;
  lastUsed: string | null;
}

interface MessageContent {
  type?: string;
  text?: string;
}

// Liste des skills connus (basée sur ~/clawd/skills/)
const KNOWN_SKILLS = [
  "plan-mode", "brainstorm", "community-manager", "notion",
  "github", "coding-agent", "summarize", "pdf", "excel",
  "weather", "tmux", "system-audit", "self-diagnostic",
  "frontend-design", "agent-builder", "agent-observability-dashboard",
  "gemini-image-gen", "menu-dd-roques", "canvas", "planning",
  "x-grok", "xai-grok-search", "polymarket", "himalaya",
  "skill-creator", "visual-qa", "council", "nightly-improvement"
];

export async function GET() {
  try {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    // Lister tous les agents
    const agents = await readdir(AGENTS_DIR);
    const sessionsData: { sessionFile: string; updatedAt: number }[] = [];

    // Récupérer les métadonnées de toutes les sessions
    for (const agent of agents) {
      const sessionsJsonPath = join(AGENTS_DIR, agent, "sessions", "sessions.json");
      
      if (!existsSync(sessionsJsonPath)) {
        continue;
      }

      const content = await readFile(sessionsJsonPath, "utf-8");
      const sessions = JSON.parse(content);

      for (const [key, data] of Object.entries(sessions)) {
        const session = data as any;
        sessionsData.push({
          sessionFile: session.sessionFile,
          updatedAt: session.updatedAt || 0
        });
      }
    }

    // Extraire l'utilisation des skills depuis les JSONL
    const skillsUsage: Record<string, { count: number; tokens: number; lastUsed: number }> = {};

    // Initialiser les skills connus
    KNOWN_SKILLS.forEach(skill => {
      skillsUsage[skill] = { count: 0, tokens: 0, lastUsed: 0 };
    });

    // Parcourir les sessions actives (7 derniers jours)
    for (const session of sessionsData) {
      if (session.updatedAt < sevenDaysAgo) {
        continue;
      }

      if (!existsSync(session.sessionFile)) {
        continue;
      }

      // Lire le JSONL ligne par ligne
      const lines = (await readFile(session.sessionFile, "utf-8")).split("\n");
      let sessionTokens = 0;

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const entry: MessageEntry = JSON.parse(line);

          // Extraire les tokens des messages
          let messageTokens = 0;
          if (entry.type === "message" && entry.message?.role === "assistant") {
            // Chercher usage dans les messages assistant
            const content = entry.message.content || [];
            
            // Estimer les tokens du message (approximation basée sur la longueur du texte)
            for (const item of content) {
              if (item.type === "text" && item.text) {
                // Estimation : ~4 tokens pour 1000 caractères
                messageTokens += Math.ceil((item.text.length || 0) / 4);
              }
            }
          }

          // Extraire les skills mentionnés dans le texte
          if (entry.type === "message" && entry.message?.content) {
            const text = entry.message.content
              .map((c: MessageContent) => c.text || "")
              .join(" ");

            // Chercher les patterns de skills
            KNOWN_SKILLS.forEach(skill => {
              // Pattern : "skill:", "🔹 skill:", "skill.md", etc.
              const patterns = [
                `skill: ${skill}`,
                `🔹 skill: ${skill}`,
                `🔹 [${skill}]`,
                `[${skill}]`,
                `${skill}.md`
              ];

              for (const pattern of patterns) {
                if (text.toLowerCase().includes(pattern.toLowerCase())) {
                  skillsUsage[skill] = skillsUsage[skill] || { count: 0, tokens: 0, lastUsed: 0 };
                  skillsUsage[skill].count += 1;
                  skillsUsage[skill].tokens += messageTokens;
                  skillsUsage[skill].lastUsed = Math.max(skillsUsage[skill].lastUsed, session.updatedAt);
                  break;
                }
              }
            });
          }
        } catch (e) {
          // Ignorer les lignes invalides
        }
      }
    }

    // Convertir en tableau et trier par nombre d'utilisations
    const skillsList: SkillUsage[] = Object.entries(skillsUsage)
      .filter(([_, data]) => data.count > 0)
      .map(([skill, data]) => ({
        skill,
        count: data.count,
        tokens: data.tokens,
        lastUsed: data.lastUsed ? new Date(data.lastUsed).toISOString() : null
      }))
      .sort((a, b) => b.count - a.count);

    // Calculer les totaux
    const totalUsages = skillsList.reduce((sum, s) => sum + s.count, 0);
    const totalTokens = skillsList.reduce((sum, s) => sum + s.tokens, 0);

    return NextResponse.json({
      skills: skillsList,
      stats: {
        total: skillsList.length,
        totalUsages,
        totalTokens,
        topSkill: skillsList[0]?.skill || null
      },
      period: "7d"
    });
  } catch (error: any) {
    console.error("Erreur API /api/skills:", error);
    
    return NextResponse.json({
      skills: [],
      stats: {
        total: 0,
        totalUsages: 0,
        totalTokens: 0,
        topSkill: null
      },
      period: "7d",
      error: error?.message || "Erreur récupération skills"
    }, { status: 500 });
  }
}
