"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface QuotaData {
  zai: { used: number; total: number; percent: number };
  minimax: { used: number; total: number; percent: number };
  openrouter: { used: number; total: number; percent: number };
}

export function QuotasDisplay() {
  const { data, error, isLoading } = useSWR<QuotaData>("/api/quotas", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const quotas = [
    { name: "Z.AI", ...data?.zai },
    { name: "MiniMax", ...data?.minimax },
    { name: "OpenRouter", ...data?.openrouter },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quotas API
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {quotas.map((q) => {
            const percent = q.percent ?? 0;
            return (
              <div key={q.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{q.name}</span>
                  <span className="text-white">{percent}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      percent > 80 ? "bg-red-500" : percent > 50 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
