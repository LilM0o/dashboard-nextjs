"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface CronJob {
  schedule: string;
  last_run?: string;
  next_run?: string;
  status: 'success' | 'failed' | 'running';
}

interface CronData {
  jobs: CronJob[];
}

export function CronJobs() {
  const [data, setData] = useState<CronData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cron');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: CronData = await response.json();
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

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getJobIcon = (status: CronJob['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'running':
        return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5 text-orange-400" />
          Cron Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {data?.jobs && data.jobs.length > 0 ? (
              <div className="space-y-2">
                {data.jobs.map((job, idx) => (
                  <div key={idx} className="p-3 rounded border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">{job.schedule}</div>
                        {job.status === 'running' && (
                          <div className="text-xs text-yellow-400 ml-2">En cours...</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getJobIcon(job.status)}
                        <div className={`text-xs ${
                          job.status === 'success' ? 'text-green-400' :
                          job.status === 'failed' ? 'text-red-400' :
                          'text-slate-400'
                        }`}>
                          {job.status === 'success' && 'Exécuté'}
                          {job.status === 'failed' && 'Échoué'}
                          {job.status === 'running' && 'En cours'}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Dernière exécution: {formatTime(job.last_run)}</span>
                      <span>Prochaine: {formatTime(job.next_run)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucun cron job configuré
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
