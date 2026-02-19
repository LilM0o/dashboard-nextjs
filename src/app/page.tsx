"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemMetrics } from "@/components/dashboard/system-metrics";
import { QuotasDisplay } from "@/components/dashboard/quotas-display";
import { TokensChart } from "@/components/dashboard/tokens-chart";
import { ErrorsDisplay } from "@/components/dashboard/errors-display";
import { CronJobs } from "@/components/dashboard/cron-jobs";
import { AgentsKpis } from "@/components/dashboard/agents-kpis";
import { SessionsList } from "@/components/dashboard/sessions-list";
import { Activity, Zap, Folder, Server, ExternalLink } from "lucide-react";

type TabType = "system" | "ai";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("system");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header with Quick Links */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">🚀 OpenClaw Dashboard</h1>
            <p className="text-slate-400">Monitoring temps réel - Refresh: 30s</p>
          </div>
          
          {/* Quick Links */}
          <div className="flex gap-3">
            <a
              href="http://100.86.54.54:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Server className="w-4 h-4" />
              <span className="text-sm font-medium">Gateway</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="http://100.86.54.54:8443"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Folder className="w-4 h-4" />
              <span className="text-sm font-medium">Files</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "system"
                ? "bg-blue-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Activity className="w-5 h-5" />
            🖥️ Système
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "ai"
                ? "bg-purple-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            <Zap className="w-5 h-5" />
            🤖 AI Tools
          </button>
        </div>
      </header>

      {/* System Tab Content */}
      {activeTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SystemMetrics />
          <ErrorsDisplay />
          <CronJobs />
        </div>
      )}

      {/* AI Tools Tab Content */}
      {activeTab === "ai" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuotasDisplay />
          <TokensChart />
          <AgentsKpis />
          <SessionsList />
        </div>
      )}
    </div>
  );
}
