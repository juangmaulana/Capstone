"use client";

import { ScrollText, Filter, Info, AlertTriangle, AlertCircle, CheckCircle2, Server, Database, Wifi } from "lucide-react";
import { useState } from "react";

type LogLevel = "info" | "warning" | "error" | "success";

interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  user?: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1, timestamp: "2026-04-15 09:32:14", level: "info", source: "Auth", message: "User login successful", user: "Dr. Andi Prasetyo" },
  { id: 2, timestamp: "2026-04-15 09:28:05", level: "success", source: "Data", message: "Species observation batch upload completed (142 records)", user: "Siti Nurhaliza" },
  { id: 3, timestamp: "2026-04-15 09:15:42", level: "warning", source: "System", message: "High memory usage detected on prediction service (87%)" },
  { id: 4, timestamp: "2026-04-15 08:55:30", level: "error", source: "API", message: "GeoJSON processing failed — invalid coordinate format", user: "Budi Santoso" },
  { id: 5, timestamp: "2026-04-15 08:40:11", level: "info", source: "Auth", message: "User login successful", user: "Rudi Hermawan" },
  { id: 6, timestamp: "2026-04-15 08:22:00", level: "success", source: "SDM", message: "Prediction model training completed — Acacia nilotica (2026)" },
  { id: 7, timestamp: "2026-04-15 07:55:18", level: "info", source: "System", message: "Daily database backup completed successfully" },
  { id: 8, timestamp: "2026-04-15 07:30:00", level: "warning", source: "API", message: "Rate limit approaching for external GBIF API requests (85%)" },
  { id: 9, timestamp: "2026-04-14 23:00:00", level: "info", source: "System", message: "Scheduled maintenance window started" },
  { id: 10, timestamp: "2026-04-14 22:15:33", level: "error", source: "Data", message: "CSV import failed — duplicate species record detected", user: "Maya Putri" },
];

const LEVEL_STYLES: Record<LogLevel, { bg: string; text: string; icon: typeof Info }> = {
  info: { bg: "bg-blue-100", text: "text-blue-700", icon: Info },
  warning: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle },
  error: { bg: "bg-red-100", text: "text-red-700", icon: AlertCircle },
  success: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2 },
};

const systemStatus = [
  { label: "API Server", status: "Online", icon: Server, color: "text-green-600" },
  { label: "Database", status: "Online", icon: Database, color: "text-green-600" },
  { label: "External APIs", status: "Degraded", icon: Wifi, color: "text-amber-600" },
];

export default function SystemLogs() {
  const [filter, setFilter] = useState<LogLevel | "all">("all");

  const filteredLogs = filter === "all"
    ? MOCK_LOGS
    : MOCK_LOGS.filter((log) => log.level === filter);

  return (
    <div className="p-6 space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {systemStatus.map((s) => (
          <div key={s.label} className="stat-card flex items-center gap-3">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-sm font-semibold ${s.color}`}>{s.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Activity Logs</h2>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "info", "warning", "error", "success"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  filter === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {filteredLogs.map((log) => {
            const style = LEVEL_STYLES[log.level];
            const Icon = style.icon;
            return (
              <div key={log.id} className="flex items-start gap-3 px-6 py-3 hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${style.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${style.bg} ${style.text}`}>
                      {log.level}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {log.source}
                    </span>
                    {log.user && (
                      <span className="text-xs text-muted-foreground">by {log.user}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm">{log.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                  {log.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
