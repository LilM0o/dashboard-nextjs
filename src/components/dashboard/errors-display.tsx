"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, FileText, X, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ErrorEntry {
  id: string;
  type: "error" | "timeout";
  message: string;
  timestamp: string;
  category: string;
  severity: "low" | "medium" | "high";
}

interface MetricsData {
  errors_24h: number;
  timeouts_24h: number;
  restarts_24h: number;
  messages_today: number;
  error_details?: ErrorEntry[];
}

export function ErrorsDisplay() {
  const { data, error, isLoading } = useSWR<MetricsData>("/api/metrics", fetcher, {
    refreshInterval: 30000,
  });

  const [selectedError, setSelectedError] = useState<ErrorEntry | null>(null);
  const [filterType, setFilterType] = useState<"all" | "error" | "timeout">("all");

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const errors = data?.errors_24h ?? 0;
  const timeouts = data?.timeouts_24h ?? 0;
  const errorDetails = data?.error_details ?? [];

  const filteredErrors = filterType === "all" 
    ? errorDetails 
    : errorDetails.filter((e: any) => e.type === filterType);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      default: return "text-green-400";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-900 text-red-400";
      case "medium": return "bg-yellow-900 text-yellow-400";
      default: return "bg-green-900 text-green-400";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Errors (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFilterType(filterType === "error" ? "all" : "error")}
              className={`text-center p-3 rounded transition-all ${
                filterType === "all" || filterType === "error"
                  ? "bg-slate-900 hover:bg-slate-800 border-2 border-red-900"
                  : "bg-slate-900/50 opacity-50"
              }`}
            >
              <span className={`text-2xl font-bold ${errors > 50 ? "text-red-400" : "text-white"}`}>
                {errors}
              </span>
              <p className="text-slate-400 text-xs">erreurs</p>
            </button>
            <button
              onClick={() => setFilterType(filterType === "timeout" ? "all" : "timeout")}
              className={`text-center p-3 rounded transition-all ${
                filterType === "all" || filterType === "timeout"
                  ? "bg-slate-900 hover:bg-slate-800 border-2 border-yellow-900"
                  : "bg-slate-900/50 opacity-50"
              }`}
            >
              <span className={`text-2xl font-bold ${timeouts > 20 ? "text-red-400" : "text-yellow-400"}`}>
                {timeouts}
              </span>
              <p className="text-slate-400 text-xs">timeouts</p>
            </button>
          </div>
          <div className="mt-3 text-center text-sm">
            <span className="text-slate-400">Messages aujourd'hui: </span>
            <span className="text-white">{data?.messages_today ?? 0}</span>
          </div>

          {/* Liste des erreurs */}
          {filteredErrors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400 mb-2">
                Dernières erreurs ({filteredErrors.length})
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {filteredErrors.slice(0, 5).map((err: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedError(err)}
                    className="w-full flex items-center justify-between p-2 bg-slate-900/50 rounded hover:bg-slate-800 transition-all text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <AlertTriangle className={`w-3 h-3 ${err.type === "error" ? "text-red-400" : "text-yellow-400"}`} />
                      <span className="text-xs text-white truncate">{err.message || err.type}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {selectedError && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedError(null)}
        >
          <div 
            className="bg-slate-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${selectedError.type === "error" ? "text-red-400" : "text-yellow-400"}`} />
                <h3 className="text-white font-medium">
                  {selectedError.type === "error" ? "Erreur" : "Timeout"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
              <div>
                <div className="text-xs text-slate-400 mb-1">Message</div>
                <div className="text-white text-sm bg-slate-800 rounded p-3 font-mono">
                  {selectedError.message}
                </div>
              </div>
              
              <div>
                <div className="text-xs text-slate-400 mb-1">Catégorie</div>
                <div className="text-white text-sm">{selectedError.category || "Général"}</div>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1">Sévérité</div>
                <span className={`text-xs px-2 py-1 rounded ${getSeverityBadge(selectedError.severity)}`}>
                  {selectedError.severity || "unknown"}
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-400 mb-1">Timestamp</div>
                <div className="flex items-center gap-2 text-white text-sm">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{selectedError.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}