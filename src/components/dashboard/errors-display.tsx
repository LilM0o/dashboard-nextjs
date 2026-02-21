"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface ErrorDetails {
  timestamp: string;
  type: string;
  message: string;
  details?: string;
}

interface ErrorsData {
  errors_24h: number;
  timeouts_24h: number;
  restarts_24h: number;
  error_details: ErrorDetails[];
  timeout_details: ErrorDetails[];
}

export function ErrorsDisplay() {
  const [data, setData] = useState<ErrorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: ErrorsData = await response.json();
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

  const hasErrors = 
    (data?.errors_24h || 0) > 0 || 
    (data?.timeouts_24h || 0) > 0 || 
    (data?.restarts_24h || 0) > 0;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          Erreurs & Timeouts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {/* Status Indicator */}
            <div className="text-center mb-4">
              {hasErrors ? (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-red-500/20 border border-red-500/30">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-white font-semibold">Erreurs détectées</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-500/20 border border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold">Tout va bien</span>
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 rounded bg-slate-900/50">
                <div className="text-3xl font-bold text-white">{data?.errors_24h ?? 0}</div>
                <div className="text-xs text-slate-400 mt-1">Erreurs 24h</div>
              </div>
              <div className="text-center p-3 rounded bg-slate-900/50">
                <div className="text-3xl font-bold text-white">{data?.timeouts_24h ?? 0}</div>
                <div className="text-xs text-slate-400 mt-1">Timeouts 24h</div>
              </div>
              <div className="text-center p-3 rounded bg-slate-900/50">
                <div className="text-3xl font-bold text-white">{data?.restarts_24h ?? 0}</div>
                <div className="text-xs text-slate-400 mt-1">Redémarrages 24h</div>
              </div>
            </div>

            {/* Error Details */}
            {hasErrors && data?.error_details && data.error_details.length > 0 && (
              <div className="space-y-2 mt-3">
                <div className="text-sm text-slate-400 mb-2">Dernières erreurs:</div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {data.error_details.slice(0, 5).map((err, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-800 text-xs">
                      <div className="text-slate-400 mb-1">
                        {formatTime(err.timestamp)} - {err.type}
                      </div>
                      <div className="text-white">{err.message}</div>
                      {err.details && (
                        <div className="text-slate-300 mt-1">{err.details}</div>
                      )}
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
