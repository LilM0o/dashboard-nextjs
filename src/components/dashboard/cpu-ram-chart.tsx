"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, Activity, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { useEffect, useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface HistoryPoint {
  timestamp: number;
  value: number;
}

interface HistoryData {
  cpuHistory?: HistoryPoint[];
  ramHistory?: HistoryPoint[];
}

interface CpuRamChartProps {
  className?: string;
}

export function CpuRamChart({ className = "" }: CpuRamChartProps) {
  const { data, error, isLoading } = useSWR<HistoryData>("/api/history", fetcher, {
    refreshInterval: 60000, //1 minute
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdate(new Date());
  }, [data]);

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const cpuHistory = data?.cpuHistory ?? [];
  const ramHistory = data?.ramHistory ?? [];

  // Afficher le graphique même avec peu de données, ou un placeholder initial
  if (cpuHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Cpu className="w-5 h-5 text-blue-400" />
            Évolution Système (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-slate-400 text-sm">
              📊 Première collecte de données en cours...
            </div>
            <div className="text-slate-500 text-xs">
              L'historique sera disponible après 1 heure de fonctionnement
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const barWidth = 100 / cpuHistory.length;

  const getCpuColor = (value: number) => {
    if (value < 30) return "bg-green-500";
    if (value < 70) return "bg-orange-500";
    return "bg-red-500";
  };

  const getRamColor = (value: number) => {
    if (value < 50) return "bg-green-500";
    if (value < 80) return "bg-orange-500";
    return "bg-red-500";
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const startTime = formatTime(cpuHistory[0].timestamp);
  const endTime = formatTime(cpuHistory[cpuHistory.length - 1].timestamp);

  const avgCpu = Math.round(cpuHistory.reduce((sum, p) => sum + p.value, 0) / cpuHistory.length);
  const avgRam = Math.round(ramHistory.reduce((sum, p) => sum + p.value, 0) / ramHistory.length);

  const maxCpu = Math.max(...cpuHistory.map(p => p.value));
  const maxRam = Math.max(...ramHistory.map(p => p.value));

  return (
    <Card className={className || "lg:col-span-2"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Cpu className="w-5 h-5 text-blue-400" />
          Évolution Système (24h)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* CPU Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">CPU</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Max: <span className="text-white font-semibold">{maxCpu}%</span>
                </span>
                <span className="text-xs text-slate-400">
                  Avg: <span className="text-white font-semibold">{avgCpu}%</span>
                </span>
              </div>
            </div>
            <div className="relative h-32 border-l border-b border-slate-700 p-3">
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-1/4 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-2/4 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-3/4 left-0 right-0 border-t border-slate-700/50" />
              </div>
              {/* Bars */}
              <div className="relative h-full flex items-end gap-0.5">
                {cpuHistory.map((point, index) => {
                  const height = Math.max(point.value, 3);
                  const color = getCpuColor(point.value);
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm transition-all hover:opacity-70"
                      style={{
                        height: `${height}%`,
                        width: `${barWidth}%`,
                        minWidth: "6px",
                        maxWidth: "20px"
                      }}
                      title={`${formatTime(point.timestamp)}: ${point.value}%`}
                    >
                      <div
                        className={`w-full h-full rounded-t-sm ${color}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RAM Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">RAM</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Max: <span className="text-white font-semibold">{maxRam}%</span>
                </span>
                <span className="text-xs text-slate-400">
                  Avg: <span className="text-white font-semibold">{avgRam}%</span>
                </span>
              </div>
            </div>
            <div className="relative h-32 border-l border-b border-slate-700 p-3">
              {/* Grid lines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-1/4 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-2/4 left-0 right-0 border-t border-slate-700/50" />
                <div className="absolute top-3/4 left-0 right-0 border-t border-slate-700/50" />
              </div>
              {/* Bars */}
              <div className="relative h-full flex items-end gap-0.5">
                {ramHistory.map((point, index) => {
                  const height = Math.max(point.value, 3);
                  const color = getRamColor(point.value);
                  return (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm transition-all hover:opacity-70"
                      style={{
                        height: `${height}%`,
                        width: `${barWidth}%`,
                        minWidth: "6px",
                        maxWidth: "20px"
                      }}
                      title={`${formatTime(point.timestamp)}: ${point.value}%`}
                    >
                      <div
                        className={`w-full h-full rounded-t-sm ${color}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time legend */}
          <div className="flex justify-between text-xs text-slate-400">
            <span>{startTime}</span>
            <span>{endTime}</span>
          </div>

          {/* Color legend */}
          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-xs text-slate-300">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-orange-500" />
              <span className="text-xs text-slate-300">Activité</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-xs text-slate-300">Très fort</span>
            </div>
          </div>

          {/* Last update */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pt-2">
            <RefreshCw className="w-3 h-3" />
            <span>Mis à jour: {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
