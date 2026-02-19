"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Mock data for the chart (last 7 days)
const mockChartData = [
  { day: "Lun", tokens: 120000 },
  { day: "Mar", tokens: 180000 },
  { day: "Mer", tokens: 150000 },
  { day: "Jeu", tokens: 220000 },
  { day: "Ven", tokens: 190000 },
  { day: "Sam", tokens: 80000 },
  { day: "Dim", tokens: 60000 },
];

interface TokensData {
  tokens_7d: number;
  cost_7d: number;
  sessions_7d: number;
  avg_response_time: number;
}

export function TokensChart() {
  const { data, error, isLoading } = useSWR<TokensData>("/api/tokens", fetcher, {
    refreshInterval: 60000,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Tokens (7 jours)</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">Erreur chargement</div>
        ) : isLoading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            <div className="flex justify-between mb-4 text-sm">
              <div>
                <span className="text-slate-400">Total: </span>
                <span className="text-white font-bold">{(data?.tokens_7d ?? 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">Coût: </span>
                <span className="text-green-400 font-bold">${(data?.cost_7d ?? 0).toFixed(2)}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={mockChartData}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line type="monotone" dataKey="tokens" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
