import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemMetrics } from "@/components/dashboard/system-metrics";
import { QuotasDisplay } from "@/components/dashboard/quotas-display";
import { TokensChart } from "@/components/dashboard/tokens-chart";
import { ErrorsDisplay } from "@/components/dashboard/errors-display";
import { CronJobs } from "@/components/dashboard/cron-jobs";
import { AgentsKpis } from "@/components/dashboard/agents-kpis";
import { SessionsList } from "@/components/dashboard/sessions-list";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">🚀 OpenClaw Dashboard</h1>
        <p className="text-slate-400">Monitoring temps réel - Prochain refresh: 30s</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <SystemMetrics />
        <QuotasDisplay />
        <TokensChart />
        <ErrorsDisplay />
        <CronJobs />
        <AgentsKpis />
      </div>

      <div className="mt-6">
        <SessionsList />
      </div>
    </div>
  );
}
