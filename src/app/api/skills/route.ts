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

    // Récupérer les métadonnées de toutes les sessions en parallèle
    const sessionsResults = await Promise.all(
      agents.map(async (agent) => {
        const sessionsJsonPath = join(AGENTS_DIR, agent, "sessions", "sessions.json");

        if (!existsSync(sessionsJsonPath)) {
          return [];
        }

        const content = await readFile(sessionsJsonPath, "utf-8");
        const sessions = JSON.parse(content);
        const agentSessions: { sessionFile: string; updatedAt: number }[] = [];

        for (const [key, data] of Object.entries(sessions)) {
          const session = data as any;
          agentSessions.push({
            sessionFile: session.sessionFile,
            updatedAt: session.updatedAt || 0
          });
        }

        return agentSessions;
      })
    );

    // Agréger par modèle depuis les JSONL en parallèle
    const skillsResults = await Promise.all(
      sessionsData
        .filter(session => session.updatedAt >= sevenDaysAgo && session.sessionFile && existsSync(session.sessionFile))
        .map(async (session) => {
          const lines = (await readFile(session.sessionFile, "utf-8")).split("\n");
          let sessionTokens = 0;
          const skillCounts: Record<string, number> = {};
          const skillTokens: Record<string, number> = {};

          for (const line of lines) {
            if (!line.trim()) continue;

            try {
              const entry: MessageEntry = JSON.parse(line);

              // Extraire les tokens des messages
              let messageTokens = 0;
              if (entry.type === "message" && entry.message?.role === "assistant") {
                // Chercher usage dans les messages assistant
                const content = entry.message.content || [];

                // Estimer les tokens du message
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
                      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
                      skillTokens[skill] = (skillTokens[skill] || 0) + messageTokens;
                      break;
                    }
                  }
                });
              }
            } catch (e) {
              // Ignorer les lignes invalides
            }
          }

          return { skillCounts, skillTokens, sessionTokens };
        })
    );

    // Fusionner les résultats
    const skillsUsage: Record<string, { count: number; tokens: number; lastUsed: number }> = {};
    
    // Initialiser les skills connus
    KNOWN_SKILLS.forEach(skill => {
      skillsUsage[skill] = { count: 0, tokens: 0, lastUsed: 0 };
    });

    for (const result of skillsResults) {
      for (const [skill, count] of Object.entries(result.skillCounts)) {
        if (count > 0) {
          skillsUsage[skill] = {
            count: skillsUsage[skill].count + count,
            tokens: skillsUsage[skill].tokens + result.skillTokens[skill],
            lastUsed: Math.max(skillsUsage[skill].lastUsed, result.sessionTokens > 0 ? result.sessionTokens : 0)
          };
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
