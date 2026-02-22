"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Wrench, TrendingUp } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface SkillData {
  skill: string;
  count: number;
  tokens: number;
  lastUsed: string | null;
}

interface SkillsData {
  skills: SkillData[];
  stats: {
    total: number;
    totalUsages: number;
    totalTokens: number;
    topSkill: string | null;
  };
  period: string;
}

const COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981',
  '#f97316', '#6366f1', '#14b8a6', '#e11d48'
];

// Fixed heights for charts (responsive handled by ResponsiveContainer)
const PIE_HEIGHT = 220;
const BAR_HEIGHT = 160;

// Format des noms de skills pour l'affichage
const formatSkillName = (skill: string) => {
  const nameMap: Record<string, string> = {
    "plan-mode": "Plan Mode",
    "brainstorm": "Brainstorm",
    "community-manager": "Community Mgr",
    "notion": "Notion",
    "github": "GitHub",
    "coding-agent": "Coding Agent",
    "summarize": "Summarize",
    "pdf": "PDF",
    "excel": "Excel",
    "weather": "Weather",
    "tmux": "Tmux",
    "system-audit": "System Audit",
    "self-diagnostic": "Self Diagnostic",
    "frontend-design": "Frontend Design",
    "agent-builder": "Agent Builder",
    "agent-observability-dashboard": "Observability",
    "gemini-image-gen": "Gemini Images",
    "menu-dd-roques": "Menu DD Roques",
    "canvas": "Canvas",
    "planning": "Planning",
    "x-grok": "X-Grok",
    "xai-grok-search": "Grok Search",
    "polymarket": "Polymarket",
    "himalaya": "Himalaya",
    "skill-creator": "Skill Creator",
    "visual-qa": "Visual QA",
    "council": "Council",
    "nightly-improvement": "Nightly Improv."
  };
  
  return nameMap[skill] || skill;
};

export function SkillsChart() {
  const [data, setData] = useState<SkillsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/skills');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: SkillsData = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const chartData = data?.skills?.slice(0, 8).map((s) => ({
    name: formatSkillName(s.skill),
    value: s.count,
    skill: s.skill
  })) ?? [];

  const renderLabel = (entry: any) => {
    const percentage = chartData.length > 0 ? (Number(entry.value) / Number(data!.stats.totalUsages) * 100) : 0;
    return percentage > 5 ? `${percentage.toFixed(1)}%` : '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Wrench className="w-5 h-5 text-orange-400" />
          Utilisation Skills
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Top Skill</div>
                <div className="text-orange-400 font-bold text-sm truncate">
                  {data?.stats.topSkill ? formatSkillName(data.stats.topSkill) : "-"}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Utilisations</div>
                <div className="text-white font-bold">{data?.stats.totalUsages ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Skills actifs</div>
                <div className="text-cyan-400 font-bold">{data?.stats.total ?? 0}</div>
              </div>
            </div>

            {/* Pie Chart */}
            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={70}
                      innerRadius={35}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                          name={entry.name}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "1px solid #334155", 
                        borderRadius: "8px" 
                      }}
                      formatter={(value: any, name: any) => [`${value} utilisations`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucune donnée disponible
              </div>
            )}

            {/* Bar Chart for Top Skills */}
            {chartData.length > 0 && (
              <div className="w-full" style={{ height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis 
                      type="number"
                      stroke="#64748b" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      stroke="#64748b" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "1px solid #334155", 
                        borderRadius: "8px" 
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: any) => [`${value} utilisations`, ""]}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#f97316" 
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            {chartData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs">
                <div className="text-slate-400 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Top skills (7 derniers jours):
                </div>
                <div className="space-y-1">
                  {data?.skills.slice(0, 5).map((skill, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-300">
                      <span className="truncate">{formatSkillName(skill.skill)}</span>
                      <span className="font-mono text-cyan-400">{skill.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
