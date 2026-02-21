"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, HardDrive, Activity } from "lucide-react";
import { useEffect, useState } from "react";

interface SystemData {
  cpu?: number;
  ram?: number;
  disk?: number;
  uptime?: string;
}

interface CpuRamChartProps {
  className?: string;
}

export function CpuRamChart({ className = "" }: CpuRamChartProps) {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Cpu className="w-5 h-5 text-blue-400" />
          Ressources Système
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {/* CPU */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-slate-300">CPU</span>
                </div>
                <span className="text-white font-bold">{data?.cpu ?? 0}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (data?.cpu ?? 0) > 80 ? 'bg-red-500' :
                    (data?.cpu ?? 0) > 60 ? 'bg-orange-500' :
                    (data?.cpu ?? 0) > 40 ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(data?.cpu ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-slate-300">RAM</span>
                </div>
                <span className="text-white font-bold">{data?.ram ?? 0}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (data?.ram ?? 0) > 80 ? 'bg-red-500' :
                    (data?.ram ?? 0) > 60 ? 'bg-orange-500' :
                    (data?.ram ?? 0) > 40 ? 'bg-yellow-500' :
                    'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(data?.ram ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Disk */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate-300">Disque</span>
                </div>
                <span className="text-white font-bold">{data?.disk ?? 0}%</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all ${
                    (data?.disk ?? 0) > 90 ? 'bg-red-500' :
                    (data?.disk ?? 0) > 80 ? 'bg-orange-500' :
                    (data?.disk ?? 0) > 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(data?.disk ?? 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Uptime */}
            {data?.uptime && (
              <div className="pt-3 border-t border-slate-700">
                <div className="text-xs text-slate-400">
                  Uptime: <span className="text-white">{data.uptime}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
