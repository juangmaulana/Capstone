"use client";

import { ScrollText, Filter, Info, AlertTriangle, AlertCircle, CheckCircle2, Server, Database, Wifi } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  { id: 1, timestamp: "2026-04-15 09:32:14", level: "success", source: "Annotation", message: "Annotated image IMG_20260115_001.jpg — species: Vachellia nilotica", user: "Siti Nurhaliza" },
  { id: 2, timestamp: "2026-04-15 09:28:05", level: "success", source: "Verification", message: "Validated annotation for IMG_20260115_001.jpg", user: "Dr. Andi Prasetyo" },
  { id: 3, timestamp: "2026-04-15 09:15:42", level: "success", source: "Annotation", message: "Annotated image IMG_20260118_002.jpg — species: Lantana camara", user: "Budi Santoso" },
  { id: 4, timestamp: "2026-04-15 08:55:30", level: "success", source: "Verification", message: "Validated annotation for IMG_20260118_002.jpg", user: "Dr. Andi Prasetyo" },
  { id: 5, timestamp: "2026-04-15 08:40:11", level: "success", source: "Annotation", message: "Annotated image IMG_20260205_003.jpg — species: Ageratum conyzoides (corrected from Clitoria ternatea)", user: "Siti Nurhaliza" },
  { id: 6, timestamp: "2026-04-15 08:22:00", level: "warning", source: "Annotation", message: "Annotation for IMG_20260305_006.jpg — image too blurry, marked as Unknown", user: "Siti Nurhaliza" },
  { id: 7, timestamp: "2026-04-15 07:55:18", level: "error", source: "Verification", message: "Rejected annotation for IMG_20260305_006.jpg — image quality insufficient", user: "Dr. Andi Prasetyo" },
  { id: 8, timestamp: "2026-04-14 23:00:00", level: "success", source: "Annotation", message: "Annotated image IMG_20260222_005.jpg — species: Merremia hederacea", user: "Rudi Hermawan" },
  { id: 9, timestamp: "2026-04-14 22:15:33", level: "success", source: "Verification", message: "Validated annotation for IMG_20260210_004.jpg", user: "Dr. Andi Prasetyo" },
  { id: 10, timestamp: "2026-04-14 21:30:00", level: "info", source: "Annotation", message: "Batch Q1 2026 — 2 images remaining for annotation", user: "Dr. Andi Prasetyo" },
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

const LOG_COPY = {
  en: {
    title: "Annotation & Verification Logs",
    by: "by",
    filters: { all: "all", info: "info", warning: "warning", error: "error", success: "success" },
    levels: { info: "info", warning: "warning", error: "error", success: "success" },
    sources: { Annotation: "Annotation", Verification: "Verification" },
    status: { Online: "Online", Degraded: "Degraded" },
  },
  id: {
    title: "Log Anotasi & Verifikasi",
    by: "oleh",
    filters: { all: "semua", info: "info", warning: "peringatan", error: "error", success: "berhasil" },
    levels: { info: "info", warning: "peringatan", error: "error", success: "berhasil" },
    sources: { Annotation: "Anotasi", Verification: "Verifikasi" },
    status: { Online: "Online", Degraded: "Menurun" },
  },
} as const;

export default function SystemLogs() {
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const { language } = useLanguage();
  const copy = LOG_COPY[language];

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
              <p className={`text-sm font-semibold ${s.color}`}>{copy.status[s.status as keyof typeof copy.status] || s.status}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logs */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{copy.title}</h2>
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
                {copy.filters[level]}
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
                      {copy.levels[log.level]}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {copy.sources[log.source as keyof typeof copy.sources] || log.source}
                    </span>
                    {log.user && (
                      <span className="text-xs text-muted-foreground">{copy.by} {log.user}</span>
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
