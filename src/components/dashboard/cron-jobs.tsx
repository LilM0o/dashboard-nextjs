"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CronJob {
  name: string;
  schedule: string;
  status: string;
  last_status: string;
  enabled: boolean;
}

interface CronData {
  jobs: CronJob[];
  total: number;
  active: number;
}

export function CronJobs() {
  const { data, error, isLoading } = useSWR<CronData>("/api/cron", fetcher, {
    refreshInterval: 60000,
  });

  if (error) return <div className="text-red-400">Erreur chargement</div>;
  if (isLoading) return <div className="text-slate-400">Chargement...</div>;

  const jobs = data?.jobs ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Cron Jobs
          </div>
          <span className="text-xs text-slate-400">
            {data?.active ?? 0}/{data?.total ?? 0} actifs
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {jobs.map((job, i) => (
            <div key={i} className="flex justify-between items-center p-2 bg-slate-900 rounded">
              <div>
                <span className="text-white text-sm">{job.name}</span>
                <div className="text-xs text-slate-500">{job.schedule}</div>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  job.last_status === "ok"
                    ? "bg-green-900 text-green-400"
                    : job.last_status === "error"
                    ? "bg-red-900 text-red-400"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {job.last_status ?? "unknown"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
