"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Zap, Clock, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface AgentData {
  agentId: string;
  tool_name: string;
  count: number;
  success_rate: number;
  avg_latency_ms: number;
}

interface SkillData {
  source: string;
  tool_name: string;
  count: number;
  success_rate: number;
  avg_latency_ms: number;
}

interface KpisData {
  recent_sessions: any[];
  active_count: number;
  total_tokens: number;
  total_messages: number;
  total_sessions: number;
  kpis: {
    total_calls: number;
    success_rate: number;
    avg_latency_ms: number;
    total_tokens: number;
    unique_sessions: number;
  };
  by_agent: AgentData[];
  by_skill: SkillData[];
}

export function AgentsKpis() {
  const [data, setData] = useState<KpisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: KpisData = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatLatency = (ms: number) => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms >= 1) return `${ms.toFixed(0)}ms`;
    return `${(ms * 1000).toFixed(0)}μs`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5 text-cyan-400" />
          Agents KPIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {/* Global Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Appels totaux</span>
                <span className="text-white font-bold text-lg">{data?.kpis?.total_calls ?? 0}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Taux de succès</span>
                <span className="text-green-400 font-bold text-lg">{data?.kpis?.success_rate ?? 0}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Latence moyenne</span>
                <span className="text-white font-bold text-lg">{formatLatency(data?.kpis?.avg_latency_ms ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Sessions uniques</span>
                <span className="text-white font-bold text-lg">{data?.kpis?.unique_sessions ?? 0}</span>
              </div>
            </div>

            {/* By Agent */}
            {data?.by_agent && data.by_agent.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-slate-400 mb-2">Par agent:</div>
                <div className="space-y-1">
                  {data.by_agent.map((agent, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800">
                      <span className="text-slate-300">{agent.tool_name}</span>
                      <span className="text-white">({agent.count} calls)</span>
                      <span className="text-green-400">{agent.success_rate}%</span>
                      <span className="text-slate-300">{formatLatency(agent.avg_latency_ms)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By Skill */}
            {data?.by_skill && data.by_skill.length > 0 && (
              <div>
                <div className="text-sm text-slate-400 mb-2">Par skill:</div>
                <div className="space-y-1">
                  {data.by_skill.slice(0, 3).map((skill, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-800">
                      <span className="text-slate-300">{skill.tool_name}</span>
                      <span className="text-white">({skill.count} calls)</span>
                      <span className="text-green-400">{skill.success_rate}%</span>
                      <span className="text-slate-300">{formatLatency(skill.avg_latency_ms)}</span>
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
