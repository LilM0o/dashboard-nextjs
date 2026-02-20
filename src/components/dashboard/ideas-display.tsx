"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Clock, Zap, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type IdeaStatus = "proposed" | "in-progress" | "completed";

const statusConfig: Record<IdeaStatus, { label: string; icon: any; color: string }> = {
  proposed: { label: "Proposée", icon: Lightbulb, color: "text-yellow-400" },
  "in-progress": { label: "En cours", icon: Zap, color: "text-blue-400" },
  completed: { label: "Terminée", icon: CheckCircle2, color: "text-green-400" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  High: { label: "Haute", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  Medium: { label: "Moyenne", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  Low: { label: "Basse", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
};

export function IdeasDisplay() {
  const { data, error } = useSWR("/api/ideas", fetcher, { refreshInterval: 60000 });

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Idées & Roadmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">Erreur lors du chargement des idées.</p>
        </CardContent>
      </Card>
    );
  }

  const ideas = data?.ideas || [];

  return (
    <Card className="bg-gradient-to-br from-slate-900/50 to-slate-900/30 border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Idées & Roadmap
          </CardTitle>
          <span className="text-slate-400 text-xs"> {ideas.length} idée{ideas.length !== 1 ? "s" : ""} </span>
        </div>
      </CardHeader>
      <CardContent>
        {ideas.length === 0 ? (
          <p className="text-slate-400 text-sm">Aucune idée pour le moment.</p>
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {ideas.map((idea: any) => {
              const status = statusConfig[idea.status as IdeaStatus];
              const StatusIcon = status.icon;
              const priority = priorityConfig[idea.priority] || priorityConfig.Medium;

              return (
                <div
                  key={idea.id}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-semibold text-sm flex-1">{idea.title}</h3>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${priority.color} shrink-0`}
                    >
                      {priority.label}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mb-2 line-clamp-2">
                    {idea.description}
                  </p>

                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{status.label}</span>
                    </div>

                    <div className={`flex items-center gap-1 text-slate-500 text-xs`}>
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(idea.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>

                  {idea.category && (
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                        {idea.category}
                      </span>

                      {idea.estimatedEffort && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                          ⏱️ {idea.estimatedEffort}
                        </span>
                      )}
                    </div>
                  )}

                  {idea.details && idea.details.length > 0 && (
                    <details className="mt-2 group">
                      <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                        Voir les détails
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {idea.details.map((detail: string, idx: number) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-400 flex items-start gap-2"
                          >
                            <span className="mt-1 w-1 h-1 rounded-full bg-slate-500 shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
