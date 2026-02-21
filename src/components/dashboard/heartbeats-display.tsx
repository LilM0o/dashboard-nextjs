"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface Heartbeat {
  name: string;
  status: 'success' | 'failed' | 'pending';
  last_run?: string;
  next_run?: string;
}

interface HeartbeatsData {
  heartbeats: Heartbeat[];
}

export function HeartbeatsDisplay() {
  const [data, setData] = useState<HeartbeatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/heartbeats');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: HeartbeatsData = await response.json();
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

  const getStatusIcon = (status: Heartbeat['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Heart className="w-5 h-5 text-red-400" />
          Heartbeats
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {data?.heartbeats && data.heartbeats.length > 0 ? (
              <div className="space-y-2">
                {data.heartbeats.map((hb, idx) => (
                  <div key={idx} className="p-3 rounded border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(hb.status)}
                        <div className="text-sm text-white font-medium">{hb.name}</div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        hb.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        hb.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {hb.status === 'success' && 'OK'}
                        {hb.status === 'failed' && 'Échoué'}
                        {hb.status === 'pending' && 'En attente'}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Dernière exécution: {formatTime(hb.last_run)}</span>
                      <span>Prochaine: {formatTime(hb.next_run)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-4">
                Aucun heartbeat configuré
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
