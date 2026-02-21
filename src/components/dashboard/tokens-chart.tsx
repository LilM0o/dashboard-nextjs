import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { MessageSquare, Clock, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyData {
  date: string;
  tokens: number;
  sessions: number;
}

interface TokensData {
  tokens_7d: number;
  tokens_input: number;
  tokens_output: number;
  cost_7d: number;
  sessions_7d: number;
  avg_response_time: number;
  period: string;
  daily: DailyData[];
}

const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function TokensChart() {
  const [data, setData] = useState<TokensData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data server-side
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/tokens');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: TokensData = await response.json();
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

  const chartData = data?.daily?.map((d) => {
    const date = new Date(d.date);
    const dayName = DAYS_FR[date.getDay()];
    return {
      day: dayName,
      date: d.date,
      tokens: d.tokens,
      sessions: d.sessions
    };
  }) ?? [];

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k`;
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Tokens (7 jours)</CardTitle>
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
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-white font-bold">{formatTokens(data?.tokens_7d ?? 0)}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Sessions</div>
                <div className="text-cyan-400 font-bold">{data?.sessions_7d ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Coût</div>
                <div className="text-green-400 font-bold">${(data?.cost_7d ?? 0).toFixed(2)}</div>
              </div>
            </div>

            {/* Graphique */}
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="#64748b" 
                    fontSize={11} 
                    tickLine={false}
                    axisLine={false}
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
                Aucune donnée disponible
              </div>
            )}

            {/* Footer stats */}
            <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-slate-700 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <MessageSquare className="w-3 h-3" />
                <span>Input: <span className="text-white">{formatTokens(data?.tokens_input ?? 0)}</span></span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <MessageSquare className="w-3 h-3" />
                <span>Output: <span className="text-white">{formatTokens(data?.tokens_output ?? 0)}</span></span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
