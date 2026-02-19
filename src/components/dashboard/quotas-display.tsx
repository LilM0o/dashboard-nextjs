"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, RefreshCw, DollarSign, Cpu } from "lucide-react";
import useSWR from "swr";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Quota {
  provider: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  total_tokens: number;
  cost_estimated: number;
  budget_monthly: number;
  percent_used: number;
  status: "ok" | "warning" | "critical";
}

interface QuotasData {
  quotas: Quota[];
  total_sessions: number;
  generated_at: string;
}

export function QuotasDisplay() {
  const { data, error, isLoading } = useSWR<QuotasData>("/api/quotas", fetcher, {
    refreshInterval: 60000,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [data]);

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const quotas = data?.quotas ?? [];

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  const getBarColor = (status: string) => {
    switch (status) {
      case "critical": return "bg-red-500";
      case "warning": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "text-red-400";
      case "warning": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "critical": return "🔴";
      case "warning": return "🟡";
      default: return "🟢";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="w-5 h-5 text-yellow-400" />
          Quotas API
        </CardTitle>
      </CardHeader>
      <CardContent>
        {quotas.length === 0 ? (
          <div className="text-center text-slate-400 py-4">
            Aucune donnée de quota disponible
          </div>
        ) : (
          <div className="space-y-4">
            {quotas.map((quota) => (
              <div key={quota.provider} className="space-y-2">
                {/* Provider + Model */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium capitalize">{quota.provider}</span>
                    <span className="text-xs text-slate-500 font-mono">{quota.model}</span>
                  </div>
                  <span className={getStatusColor(quota.status)}>
                    {getStatusLabel(quota.status)} {quota.percent_used}%
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(quota.status)}`}
                    style={{ width: `${Math.min(quota.percent_used, 100)}%` }}
                  />
                </div>

                {/* Métriques détaillées */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Cpu className="w-3 h-3" />
                    <span>{formatTokens(quota.total_tokens)} tokens</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-white">
                      ${quota.cost_estimated} / ${quota.budget_monthly}
                    </span>
                  </div>
                </div>

                {/* Détail Input/Output (expansible) */}
                <div className="text-xs text-slate-500 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Input:</span>
                    <span className="text-white">{formatTokens(quota.tokens_input)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output:</span>
                    <span className="text-white">{formatTokens(quota.tokens_output)}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Footer */}
            <div className="pt-3 border-t border-slate-700">
              <div className="flex items-center gap-2 text-xs">
                <RefreshCw className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">
                  Mis à jour: {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
