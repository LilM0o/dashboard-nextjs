"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Session {
  session_id: string;
  tool_count: number;
  avg_latency_ms: number;
  success_rate: number;
  tokens_used: number;
  status: string;
}

interface AgentsData {
  recent_sessions: Session[];
}

export function SessionsList() {
  const { data, error, isLoading } = useSWR<AgentsData>("/api/agents", fetcher, {
    refreshInterval: 30000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const sessions = data?.recent_sessions ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Sessions Récentes</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center text-slate-400 py-4">Aucune session récente</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-2 text-slate-400">Session</th>
                  <th className="text-left p-2 text-slate-400">Status</th>
                  <th className="text-right p-2 text-slate-400">Tools</th>
                  <th className="text-right p-2 text-slate-400">Latence</th>
                  <th className="text-right p-2 text-slate-400">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="p-2 text-white font-mono text-xs truncate max-w-[150px]">
                      {session.session_id}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          session.status === "success"
                            ? "bg-green-900 text-green-400"
                            : session.status === "partial"
                            ? "bg-yellow-900 text-yellow-400"
                            : "bg-slate-700 text-slate-400"
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                    <td className="p-2 text-right text-white">{session.tool_count}</td>
                    <td className="p-2 text-right text-white">{session.avg_latency_ms}ms</td>
                    <td className="p-2 text-right text-white">{session.tokens_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
