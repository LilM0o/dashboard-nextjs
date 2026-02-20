"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MessageSquare, Cpu } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Session {
  id: string;
  name: string;
  agentId: string;
  status: string;
  lastActivity: string;
  tokens: { input: number; output: number; total: number };
  model: string;
  messagesCount: number;
}

interface AgentsData {
  recent_sessions: Session[];
  active_count: number;
  total_tokens: number;
  total_sessions: number;
}

export function SessionsList() {
  const { data, error, isLoading } = useSWR<AgentsData>("/api/agents", fetcher, {
    refreshInterval: 30000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const sessions = data?.recent_sessions ?? [];
  const activeCount = data?.active_count ?? 0;
  const totalTokens = data?.total_tokens ?? 0;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // secondes

    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString("fr-FR");
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}k`;
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Sessions Récentes</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">
              Active: <span className="text-green-400 font-semibold">{activeCount}</span>
            </span>
            <span className="text-slate-400">
              Total: <span className="text-cyan-400 font-semibold">{formatTokens(totalTokens)}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center text-slate-400 py-4">Aucune session récente</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Name + Agent + Model */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{session.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-900/50 text-blue-400">
                        {session.agentId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono truncate">{session.model}</span>
                    </div>
                  </div>

                  {/* Right: Status + Tokens + Messages + Time */}
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === "active"
                          ? "bg-green-900 text-green-400"
                          : session.status === "completed"
                          ? "bg-blue-900 text-blue-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {session.status}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Cpu className="w-3 h-3" />
                        <span className="text-white">{formatTokens(session.tokens.total)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-white">{session.messagesCount}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span className="text-white">{formatTime(session.lastActivity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
