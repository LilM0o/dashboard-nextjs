"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Heartbeat {
  name: string;
  schedule: string;
  last_run: string;
  status: string;
  enabled: boolean;
}

interface HeartbeatsData {
  jobs: Heartbeat[];
  active: number;
  total: number;
}

export function HeartbeatsDisplay() {
  const { data, error, isLoading } = useSWR<HeartbeatsData>("/api/heartbeats", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const heartbeats = data?.jobs ?? [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-red-950/20 to-orange-950/20 border-red-900/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400" />
            Heartbeats
          </div>
          <span className="text-xs text-slate-400">
            {data?.active ?? 0}/{data?.total ?? 0} actifs
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {heartbeats.length === 0 ? (
            <div className="text-center text-slate-400 py-4">
              Aucun heartbeat configuré
            </div>
          ) : (
            heartbeats.map((hb, i) => (
              <div 
                key={i} 
                className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(hb.status)}
                    <span className="text-white font-medium text-sm">{hb.name}</span>
                  </div>
                  <span className="text-xs text-slate-500">{hb.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3" />
                  <span>Dernier run: {hb.last_run}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}