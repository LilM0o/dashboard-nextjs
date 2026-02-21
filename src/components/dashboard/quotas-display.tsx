"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ProviderQuota {
  provider: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  total_tokens: number;
  cost_estimated: number;
  budget_monthly: number;
  percent_used: number;
  status: string;
}

interface QuotasData {
  quotas: ProviderQuota[];
}

export function QuotasDisplay() {
  const [data, setData] = useState<QuotasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/quotas');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: QuotasData = await response.json();
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

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      'zai': 'text-cyan-400',
      'minimax': 'text-purple-400',
      'openrouter': 'text-green-400',
      'anthropic': 'text-orange-400',
    };
    return colors[provider] || 'text-white';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ok' || status === 'warning') {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <AlertTriangle className="w-4 h-4 text-orange-400" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <DollarSign className="w-5 h-5 text-green-400" />
          Quotas API
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {data?.quotas && data.quotas.length > 0 ? (
              <div className="space-y-3">
                {data.quotas.map((quota, idx) => (
                  <div key={idx} className="p-3 rounded border border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(quota.status)}
                        <div>
                          <div className={`text-sm font-semibold ${getProviderColor(quota.provider)}`}>
                            {quota.provider}
                          </div>
                          <div className="text-xs text-slate-400">
                            {quota.model}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 mb-1">
                          {(quota.percent_used || 0).toFixed(0)}% du budget
                        </div>
                        <div className="text-lg font-bold text-white">
                          ${(quota.cost_estimated || 0).toFixed(2)}$
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Budget mensuel</span>
                        <span className="text-white font-semibold">
                          ${(quota.budget_monthly || 0).toFixed(2)}$
                        </span>
                      </div>

                      <div className="w-full">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Utilisation</span>
                          <span className="text-white">{quota.total_tokens?.toLocaleString() || 0}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              quota.percent_used || 0 > 80
                                ? 'bg-red-500'
                                : quota.percent_used || 0 > 60
                                ? 'bg-orange-500'
                                : quota.percent_used || 0 > 40
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${quota.percent_used || 0}%` }}
                          />
                        </div>
                      </div>

                      {quota.percent_used && quota.percent_used > 80 && (
                        <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                          <TrendingUp className="w-3 h-3" />
                          <span>Attention: quota proche de la limite</span>
                        </div>
                      )}

                      {quota.percent_used && quota.percent_used > 60 && quota.percent_used <= 80 && (
                        <div className="text-xs text-slate-400 mt-2">
                          Tokens input: {quota.tokens_input?.toLocaleString() || 0} | output: {quota.tokens_output?.toLocaleString() || 0}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucune donnée de quota disponible
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
