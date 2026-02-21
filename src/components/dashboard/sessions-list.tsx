"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Clock, MessageSquare, User } from "lucide-react";
import { useEffect, useState } from "react";

interface SessionItem {
  id: string;
  key: string;
  agent: string;
  model: string;
  chatType: string;
  totalTokens: number;
  totalMessages: number;
  updatedAt: string;
  lastChannel: string;
}

interface SessionsData {
  sessions: SessionItem[];
  stats: {
    total: number;
    active: number;
    totalTokens: number;
    totalMessages: number;
    period: string;
  };
}

export function SessionsList() {
  const [data, setData] = useState<SessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sessions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result: SessionsData = await response.json();
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

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}k`;
    return tokens.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <List className="w-5 h-5 text-purple-400" />
          Sessions Récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : loading ? (
          <div className="text-slate-400">Chargement...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Total</div>
                <div className="text-white font-bold">{data?.stats?.total ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Actives</div>
                <div className="text-cyan-400 font-bold">{data?.stats?.active ?? 0}</div>
              </div>
              <div className="text-center p-2 rounded bg-slate-900/50">
                <div className="text-xs text-slate-400">Tokens</div>
                <div className="text-white font-bold">{formatTokens(data?.stats?.totalTokens ?? 0)}</div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {data?.sessions?.slice(0, 10).map((session, idx) => (
                <div
                  key={session.id}
                  onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedSession?.id === session.id
                      ? 'bg-cyan-500/20 border-cyan-500/40'
                      : 'bg-slate-900/30 border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-slate-400 mb-1">
                        <div className="font-semibold text-white">{session.agent}</div>
                        <div className="text-slate-300">{session.model}</div>
                        <div className="text-slate-300">{session.chatType}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-400">
                          {formatDate(session.updatedAt)} {formatTime(session.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-white">{formatTokens(session.totalTokens)}</span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <User className="w-3 h-3" />
                        <span className="text-slate-300">{session.totalMessages} msgs</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Session Details */}
            {selectedSession && (
              <div className="mt-3 pt-3 border-t border-slate-700 p-3 rounded bg-slate-900/50">
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">ID:</div>
                  <div className="font-mono text-xs">{selectedSession.id}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Key:</div>
                  <div className="font-mono text-xs">{selectedSession.key}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Agent:</div>
                  <div>{selectedSession.agent}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Modèle:</div>
                  <div>{selectedSession.model}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Tokens:</div>
                  <div className="text-white font-bold">{formatTokens(selectedSession.totalTokens)}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Messages:</div>
                  <div className="text-white font-bold">{selectedSession.totalMessages}</div>
                </div>
                <div className="text-sm text-white mb-2">
                  <div className="text-slate-400">Dernière mise à jour:</div>
                  <div>{formatDate(selectedSession.updatedAt)} à {formatTime(selectedSession.updatedAt)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
