"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, HardDrive, Activity, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemData {
  cpu?: number;
  ram?: number;
  disk?: number;
  uptime?: string;
}

export function SystemMetrics() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch data server-side
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/system-metrics');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: SystemData = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
        setLastUpdate(new Date());
      }
    };

    fetchData();

    // Refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="text-red-400">{error}</div>
        ) : loading ? (
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
              <div className="flex items-center gap-2 text-sm mt-2">
                <RefreshCw className="w-4 h-4 text-slate-400" />
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