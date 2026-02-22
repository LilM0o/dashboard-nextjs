import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { Brain } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface ModelData {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  count: number;
}

interface ModelsData {
  models: ModelData[];
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ModelsChart() {
  const [data, setData] = useState<ModelsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/models-usage');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: ModelsData = await response.json();
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

  const chartData = data?.models?.map(m => ({
    name: m.model,
    value: m.total_tokens
  })) ?? [];

  // Fixed label render function for PieChart - receives PieLabelRenderProps from Recharts
  const renderLabel = (props: { name?: string; value?: number; percent?: number }) => {
    const { name, value, percent } = props;
    const percentage = ((percent ?? 0) * 100).toFixed(1);
    return `${name} (${percentage}%)`;
  };

  // Fixed heights for charts (responsive handled by ResponsiveContainer)
  const PIE_HEIGHT = 220;
  const BAR_HEIGHT = 160;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Brain className="w-5 h-5 text-purple-400" />
          Utilisation Modèles
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {/* Pie Chart */}
            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: PIE_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={5}
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
                      formatter={(value: any) => `${value.toLocaleString()} tokens`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucune donnée disponible
              </div>
            )}

            {/* Bar Chart for Input/Output */}
            {chartData.length > 0 && (
              <div className="w-full" style={{ height: BAR_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(0, 5)}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
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
                      formatter={(value: any) => `${value.toLocaleString()} tokens`}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            {chartData.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700 text-xs">
                <div className="text-slate-400 mb-2">Top modèles par tokens:</div>
                <div className="space-y-1">
                  {data?.models
                    .sort((a, b) => b.total_tokens - a.total_tokens)
                    .slice(0, 3)
                    .map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300">
                        <span>{m.model}</span>
                        <span className="font-mono">{(m.total_tokens / 1000).toFixed(0)}k</span>
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
