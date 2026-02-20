"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface HistoryPoint {
  timestamp: number;
  value: number;
}

interface HistoryData {
  cpuHistory?: HistoryPoint[];
  ramHistory?: HistoryPoint[];
}

export function SystemHistoryChart() {
  const { data, error, isLoading } = useSWR<HistoryData>("/api/history", fetcher, {
    refreshInterval: 300000, // 5 minutes
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const cpuHistory = data?.cpuHistory ?? [];
  const ramHistory = data?.ramHistory ?? [];

  if (cpuHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="w-5 h-5" />
            Historique 24h
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400 text-sm">
            Pas encore de données historiques. Le dashboard collecte les données toutes les heures.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculer les dimensions du graphique
  const maxCpu = Math.max(...cpuHistory.map((p) => p.value), 100);
  const maxRam = Math.max(...ramHistory.map((p) => p.value), 100);
  const width = 100; // pourcentage
  const height = 200; // px
  const pointSpacing = width / Math.max(cpuHistory.length - 1, 1);

  // Fonction pour dessiner une courbe
  const drawPath = (history: HistoryPoint[], maxValue: number) => {
    if (history.length === 0) return "";

    const points = history.map((point, index) => {
      const x = (index / (history.length - 1)) * width;
      const y = height - (point.value / maxValue) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(" L ")}`;
  };

  const cpuPath = drawPath(cpuHistory, maxCpu);
  const ramPath = drawPath(ramHistory, maxRam);

  // Formater l'heure
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const startTime = formatTime(cpuHistory[0].timestamp);
  const endTime = formatTime(cpuHistory[cpuHistory.length - 1].timestamp);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="w-5 h-5" />
          Évolution 24h
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* SVG Chart */}
          <div className="relative" style={{ width: "100%", height: `${height}px` }}>
            <svg
              width="100%"
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
              className="overflow-visible"
            >
              {/* Grille de fond */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#334155" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Courbe CPU */}
              <path
                d={cpuPath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Courbe RAM */}
              <path
                d={ramPath}
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Légende */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-400">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-400">RAM</span>
              </div>
            </div>
            <div className="text-slate-400 text-xs">
              {startTime} → {endTime}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
            <div>
              <div className="text-xs text-slate-400 mb-1">CPU Moyen (24h)</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(cpuHistory.reduce((sum, p) => sum + p.value, 0) / cpuHistory.length)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">RAM Moyenne (24h)</div>
              <div className="text-lg font-semibold text-white">
                {Math.round(ramHistory.reduce((sum, p) => sum + p.value, 0) / ramHistory.length)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
