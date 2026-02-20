"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemMetrics } from "@/components/dashboard/system-metrics";
import { QuotasDisplay } from "@/components/dashboard/quotas-display";
import { TokensChart } from "@/components/dashboard/tokens-chart";
import { ErrorsDisplay } from "@/components/dashboard/errors-display";
import { CronJobs } from "@/components/dashboard/cron-jobs";
import { HeartbeatsDisplay } from "@/components/dashboard/heartbeats-display";
import { AgentsKpis } from "@/components/dashboard/agents-kpis";
import { SessionsList } from "@/components/dashboard/sessions-list";
import { CpuRamChart } from "@/components/dashboard/cpu-ram-chart";
import { MessagesChart } from "@/components/dashboard/messages-chart";
import { ModelsChart } from "@/components/dashboard/models-chart";
import { Activity, Zap, Folder, Server, ExternalLink, Gauge, Terminal, RefreshCw } from "lucide-react";

type TabType = "system" | "ai";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("system");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh global - recharger la page
  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  // Mise à jour automatique de la date/heure
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] p-4 md:p-6 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                OpenClaw <span className="text-cyan-400">Dashboard</span>
              </h1>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Dernière actualisation : {lastUpdate.toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="font-medium">Refresh</span>
          </button>
          
          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            <a
              href="/gateway"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg transition-all text-sm"
            >
              <Server className="w-4 h-4" />
              <span className="font-medium">Gateway</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://100.86.54.54:8443"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg transition-all text-sm"
            >
              <Folder className="w-4 h-4" />
              <span className="font-medium">Files</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/logs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 rounded-lg transition-all text-sm"
            >
              <Terminal className="w-4 h-4" />
              <span className="font-medium">Logs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://100.86.54.54:3001/dashboard.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-lg transition-all text-sm"
            >
              <Gauge className="w-4 h-4" />
              <span className="font-medium">Mission Ctrl</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mt-6 p-1 bg-slate-900/50 rounded-xl w-fit backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "system"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Activity className="w-4 h-4" />
            🖥️ Système
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === "ai"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <Zap className="w-4 h-4" />
            🤖 AI Tools
          </button>
        </div>
      </header>

      {/* System Tab Content */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          <SystemMetrics />
          <ErrorsDisplay />
          <CronJobs />
          <HeartbeatsDisplay />
          <MessagesChart />
          <CpuRamChart className="lg:col-span-2" />
        </div>
      )}

      {/* AI Tools Tab Content */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          <QuotasDisplay />
          <TokensChart />
          <ModelsChart />
          <AgentsKpis />
          <SessionsList />
        </div>
      )}
    </div>
  );
}
