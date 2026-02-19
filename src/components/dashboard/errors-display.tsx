"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MetricsData {
  errors_24h: number;
  timeouts_24h: number;
  restarts_24h: number;
  messages_today: number;
}

export function ErrorsDisplay() {
  const { data, error, isLoading } = useSWR<MetricsData>("/api/metrics", fetcher, {
    refreshInterval: 30000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const errors = data?.errors_24h ?? 0;
  const timeouts = data?.timeouts_24h ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          Errors (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-slate-900 rounded">
            <span className={`text-2xl font-bold ${errors > 50 ? "text-red-400" : "text-white"}`}>
              {errors}
            </span>
            <p className="text-slate-400 text-xs">erreurs</p>
          </div>
          <div className="text-center p-3 bg-slate-900 rounded">
            <span className={`text-2xl font-bold ${timeouts > 20 ? "text-red-400" : "text-yellow-400"}`}>
              {timeouts}
            </span>
            <p className="text-slate-400 text-xs">timeouts</p>
          </div>
        </div>
        <div className="mt-3 text-center text-sm">
          <span className="text-slate-400">Messages aujourd'hui: </span>
          <span className="text-white">{data?.messages_today ?? 0}</span>
        </div>
      </CardContent>
    </Card>
  );
}
