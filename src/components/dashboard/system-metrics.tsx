"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, HardDrive, Activity, Clock } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SystemData {
  cpu?: number;
  ram?: number;
  disk?: number;
  uptime?: string;
}

export function SystemMetrics() {
  const { data, error, isLoading } = useSWR<SystemData>("/api/system", fetcher, {
    refreshInterval: 30000,
  });

  const cpu = data?.cpu ?? 0;
  const ram = data?.ram ?? 0;
  const disk = data?.disk ?? 0;
  const uptime = data?.uptime ?? "--";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Activity className="w-5 h-5" />
          Système
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">Erreur chargement</div>
        ) : isLoading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">CPU</span>
                <span className="text-white">{cpu}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${cpu}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">RAM</span>
                <span className="text-white">{ram}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  className="h-2 bg-purple-500 rounded-full transition-all"
                  style={{ width: `${ram}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Disque</span>
                <span className="text-white">{disk}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  className="h-2 bg-green-500 rounded-full transition-all"
                  style={{ width: `${disk}%` }}
                />
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400">Uptime: {uptime}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
