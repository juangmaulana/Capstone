import { Bell, ChevronRight, Languages, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const routeLabels: Record<"en" | "id", Record<string, string>> = {
  en: {
    "/": "Dashboard",
    "/map": "Map Explorer",
    "/analytics": "Analytics",
    "/modeling": "Modeling (SDM)",
    "/data": "Data Explorer",
    "/reports": "Reports",
    "/admin": "Admin System",
    "/admin/users": "User Management",
    "/admin/species": "Species Management",
    "/admin/annotation": "Data Annotation",
    "/admin/logs": "System Logs",
  },
  id: {
    "/": "Dasbor",
    "/map": "Penjelajah Peta",
    "/analytics": "Analitik",
    "/modeling": "Pemodelan (SDM)",
    "/data": "Penjelajah Data",
    "/reports": "Laporan",
    "/admin": "Sistem Admin",
    "/admin/users": "Manajemen User",
    "/admin/species": "Manajemen Spesies",
    "/admin/annotation": "Anotasi Data",
    "/admin/logs": "Log Sistem",
  },
};

type NotificationItem = {
  title: string;
  time: string;
};

type NotificationCopy = {
  title: string;
  markAllRead: string;
  settings: string;
  viewFull: string;
  viewAll: string;
  unreadLabel: string;
  empty: string;
  items: NotificationItem[];
};

const NOTIFICATION_COPY: Record<"en" | "id", NotificationCopy> = {
  en: {
    title: "Notifications",
    markAllRead: "Mark all read",
    settings: "Notification settings",
    viewFull: "View full notification",
    viewAll: "View all notifications",
    unreadLabel: "Unread notifications",
    empty: "No new notifications.",
    items: [
      { title: "New identification needs ranger validation", time: "15 hours 22 mins ago" },
      { title: "Overdue: Review Baluran field observations", time: "1 day 14 hours ago" },
      { title: "Plant identification report has been submitted", time: "2 days 1 hour ago" },
    ],
  },
  id: {
    title: "Notifikasi",
    markAllRead: "Tandai dibaca",
    settings: "Pengaturan notifikasi",
    viewFull: "Lihat notifikasi penuh",
    viewAll: "Lihat semua notifikasi",
    unreadLabel: "Notifikasi belum dibaca",
    empty: "Tidak ada notifikasi baru.",
    items: [
      { title: "Identifikasi baru perlu validasi ranger", time: "15 jam 22 menit lalu" },
      { title: "Terlambat: Review observasi lapangan Baluran", time: "1 hari 14 jam lalu" },
      { title: "Laporan identifikasi tanaman telah dikirim", time: "2 hari 1 jam lalu" },
    ],
  },
};

export function TopNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationCopy = NOTIFICATION_COPY[language];
  const unreadCount = notificationCopy.items.length;
  const currentLabel = routeLabels[language][pathname]
    || routeLabels[language][Object.keys(routeLabels[language]).find(key => pathname.startsWith(key) && key !== "/") || ""]
    || (language === "id" ? "Halaman" : "Page");

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!notificationRef.current?.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Bio-Inspector</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </nav>

      <div className="flex-1" />

      <div ref={notificationRef} className="relative">
        <button
          type="button"
          onClick={() => setIsNotificationOpen((open) => !open)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={notificationCopy.unreadLabel}
          aria-expanded={isNotificationOpen}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount}
            </span>
          )}
        </button>

        {isNotificationOpen && (
          <div className="absolute right-0 top-11 z-50 w-[min(calc(100vw-2rem),22.5rem)] overflow-hidden rounded-lg border bg-card shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 className="text-base font-semibold text-foreground">{notificationCopy.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  {notificationCopy.markAllRead}
                </button>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={notificationCopy.settings}
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {notificationCopy.items.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">{notificationCopy.empty}</p>
              ) : (
                notificationCopy.items.map((item) => (
                  <div key={`${item.title}-${item.time}`} className="border-b px-4 py-3 last:border-b-0">
                    <p className="text-sm font-medium leading-snug text-foreground">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">{item.time}</p>
                    <button type="button" className="mt-2 text-xs font-medium text-primary hover:underline">
                      {notificationCopy.viewFull}
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              className="w-full bg-muted/50 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
            >
              {notificationCopy.viewAll}
            </button>
          </div>
        )}
      </div>

      <div className="inline-flex items-center rounded-full border bg-muted/40 p-1 text-xs font-medium">
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${language === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-pressed={language === "en"}
        >
          <Languages className="h-3.5 w-3.5" />
          EN
        </button>
        <button
          type="button"
          onClick={() => setLanguage("id")}
          className={`rounded-full px-3 py-1.5 transition-colors ${language === "id"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
            }`}
          aria-pressed={language === "id"}
        >
          ID
        </button>
      </div>
    </header>
  );
}
