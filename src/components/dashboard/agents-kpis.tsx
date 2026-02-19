"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, TrendingUp, MessageSquare, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AgentsData {
  recent_sessions: Array<{
    id: string;
    name: string;
    agentId: string;
    status: string;
    lastActivity: string;
    tokens: { total: number };
    model: string;
    messagesCount: number;
  }>;
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
  by_tool: Array<{
    agentId: string;
    tool_name: string;
    count: number;
    success_rate: number;
    avg_latency_ms: number;
  }>;
}

export function AgentsKpis() {
  const { data, error, isLoading } = useSWR<AgentsData>("/api/agents", fetcher, {
    refreshInterval: 60000,
  });

  const [showSessions, setShowSessions] = useState(false);

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const sessions = data?.recent_sessions ?? [];
  const byTool = data?.by_tool ?? [];
  const kpis = data?.kpis ?? { total_calls: 0, success_rate: 100, avg_latency_ms: 0, total_tokens: 0, unique_sessions: 0 };

  const successRate = Math.round(kpis.success_rate);
  const activeCount = data?.active_count ?? 0;
  const totalTokens = kpis.total_tokens ?? 0;
  const avgLatency = kpis.avg_latency_ms ?? 0;

  const formatLatency = (ms: number) => ms > 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5" />
          Agents KPIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-900 rounded cursor-pointer hover:bg-slate-800 transition-all" onClick={() => setShowSessions(true)}>
            <div className="text-xl font-bold text-white">{data?.total_sessions ?? 0}</div>
            <div className="text-xs text-slate-400">Sessions totales</div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded cursor-pointer hover:bg-slate-800 transition-all" onClick={() => setShowSessions(true)}>
            <div className="text-xl font-bold text-white">{successRate}%</div>
            <div className="text-xs text-slate-400">Succès</div>
            <div className={`text-xs ${successRate > 90 ? "text-green-400" : successRate > 70 ? "text-yellow-400" : "text-red-400"}`}>
              {successRate > 90 ? "✓ Excellent" : successRate > 70 ? "⚠️ Bon" : "✗ Attention"}
            </div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-blue-400">{avgLatency}ms</div>
            <div className="text-xs text-slate-400">Latence moy.</div>
          </div>
          <div className="text-center p-2 bg-slate-900 rounded">
            <div className="text-xl font-bold text-purple-400">{formatTokens(totalTokens)}</div>
            <div className="text-xs text-slate-400">Tokens</div>
          </div>
        </div>

        {/* Graphique agents/tools */}
        <div className="mb-4">
          <div className="text-xs text-slate-400 mb-2">Top agents/tools</div>
          {byTool.length > 0 ? (
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={byTool.slice(0, 5)}>
                <XAxis dataKey="tool_name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="number" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={30} tickFormatter={(v) => `${v}`} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} />
                <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-slate-400 text-sm py-2">Aucune donnée</div>
          )}
        </div>

        {/* Liste agents/tools */}
        <div className="space-y-2">
          {byTool.slice(0, 5).map((tool, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-white font-medium text-sm truncate">{tool.tool_name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-cyan-400 font-mono">{tool.count}</span>
                <span className={`text-slate-400 ${tool.success_rate >= 90 ? "text-green-400" : tool.success_rate >= 70 ? "text-yellow-400" : "text-red-400"}`}>
                  {tool.success_rate}%
                </span>
                <span className="text-slate-500">{formatLatency(tool.avg_latency_ms)}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
