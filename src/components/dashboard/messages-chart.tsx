"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { MessageCircle, TrendingUp, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyMessage {
  date: string;
  day: string;
  count: number;
  sources: Record<string, number>;
}

interface MessagesData {
  messages_today: number;
  messages_7d: number;
  total_messages: number;
  daily: DailyMessage[];
  sources: Record<string, number>;
}

export function MessagesChart() {
  const [data, setData] = useState<MessagesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: MessagesData = await response.json();
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

  const chartData = data?.daily?.map(d => ({
    day: d.day,
    count: d.count
  })) ?? [];

  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      discord: "Discord",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      signal: "Signal",
      cli: "CLI",
      unknown: "Autre"
    };
    return labels[source] || source;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="w-5 h-5 text-green-400" />
          Messages
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
                <div className="text-xs text-slate-400">Aujourd'hui</div>
                <div className="text-white font-bold text-lg">{data?.messages_today ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">7 jours</div>
                <div className="text-cyan-400 font-bold text-lg">{data?.messages_7d ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-green-400 font-bold text-lg">{data?.total_messages ?? 0}</div>
              </div>
            </div>

            {/* Graphique */}
            {chartData.length > 0 && chartData.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={100}>
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
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "#1e293b", 
                      border: "1px solid #334155", 
                      borderRadius: "8px" 
                    }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value) => [value ?? 0, "messages"]}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 py-4 flex flex-col items-center gap-2">
                <MessageCircle className="w-8 h-8 opacity-50" />
                <span>Aucune donnée disponible</span>
              </div>
            )}

            {/* Sources */}
            {data?.sources && Object.keys(data.sources).length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-2">Par source:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.sources)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([source, count]) => (
                      <span 
                        key={source}
                        className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300"
                      >
                        {getSourceLabel(source)}: {count}
                      </span>
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
