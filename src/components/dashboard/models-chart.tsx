"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, Cpu } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ModelUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  count: number;
}

interface ModelsData {
  models: ModelUsage[];
  total_tokens: number;
  total_sessions: number;
}

export function ModelsChart() {
  const { data, error, isLoading } = useSWR<ModelsData>("/api/models-usage", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const models = data?.models ?? [];
  const chartData = models.map(m => ({
    model: m.model,
    tokens: m.total_tokens,
    sessions: m.count
  }));

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k`;
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-yellow-400" />
          Modèles IA Utilisés
        </CardTitle>
      </CardHeader>
      <CardContent>
        {models.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            Aucune donnée de modèles disponible
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Total Tokens</div>
                <div className="text-white font-bold text-lg">{formatTokens(data?.total_tokens ?? 0)}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Sessions</div>
                <div className="text-cyan-400 font-bold text-lg">{data?.total_sessions ?? 0}</div>
              </div>
            </div>

            {/* Graphique */}
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData.slice(0, 5)}>
                  <XAxis 
                    dataKey="model" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(v) => formatTokens(v)}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #334155", 
                      borderRadius: "8px" 
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value: any) => [formatTokens(typeof value === 'number' ? value : Number(value)), "tokens"]}
                  />
                  <Bar 
                    dataKey="tokens" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucune donnée de modèles
              </div>
            )}

            {/* Liste des modèles */}
            <div className="space-y-2 mt-3">
              {models.slice(0, 5).map((model, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-slate-900/50 rounded">
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium text-sm truncate">{model.model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-cyan-400 font-mono">{model.count}</span>
                    <span className="text-slate-400">-</span>
                    <span className="text-white">{formatTokens(model.total_tokens)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}