"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AgentsData {
  total_calls: number;
  success_rate: number;
  avg_latency_ms: number;
  total_tokens: number;
  unique_sessions: number;
  by_tool: Array<{
    tool_name: string;
    count: number;
    avg_latency_ms: number;
    success_rate: number;
  }>;
}

export function AgentsKpis() {
  const { data, error, isLoading } = useSWR<AgentsData>("/api/agents", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const tools = data?.by_tool ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Agents KPIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-white">{data?.total_calls ?? 0}</div>
            <div className="text-xs text-slate-400">Appels</div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-green-400">{data?.success_rate ?? 0}%</div>
            <div className="text-xs text-slate-400">Succès</div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-blue-400">{data?.avg_latency_ms ?? 0}ms</div>
            <div className="text-xs text-slate-400">Latence moy.</div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-purple-400">{data?.unique_sessions ?? 0}</div>
            <div className="text-xs text-slate-400">Sessions</div>
          </div>
        </div>
        <div className="space-y-2">
          {tools.slice(0, 4).map((tool, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-slate-400">{tool.tool_name}</span>
              <span className="text-white">{tool.count} calls</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
