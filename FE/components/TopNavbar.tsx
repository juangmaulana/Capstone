import { Bell, ChevronRight, Languages, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useOptionalAuth } from "@/contexts/AuthContext";

const routeLabels: Record<"en" | "id", Record<string, string>> = {
  en: {
    "/": "Dashboard",
    "/map": "Map Explorer",
    "/analytics": "Analytics",
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
    "/data": "Penjelajah Data",
    "/reports": "Laporan",
    "/admin": "Sistem Admin",
    "/admin/users": "Manajemen User",
    "/admin/species": "Manajemen Spesies",
    "/admin/annotation": "Anotasi Data",
    "/admin/logs": "Log Sistem",
  },
};

type ApiNotification = {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationCopy = {
  title: string;
  markAllRead: string;
  markRead: string;
  settings: string;
  unreadLabel: string;
  empty: string;
  loading: string;
  error: string;
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
};

const NOTIFICATION_COPY: Record<"en" | "id", NotificationCopy> = {
  en: {
    title: "Notifications",
    markAllRead: "Mark all read",
    markRead: "Mark as read",
    settings: "Notification settings",
    unreadLabel: "Unread notifications",
    empty: "No new notifications.",
    loading: "Loading notifications...",
    error: "Failed to load notifications.",
    justNow: "Just now",
    minutesAgo: (n) => `${n} minute${n === 1 ? "" : "s"} ago`,
    hoursAgo: (n) => `${n} hour${n === 1 ? "" : "s"} ago`,
    daysAgo: (n) => `${n} day${n === 1 ? "" : "s"} ago`,
  },
  id: {
    title: "Notifikasi",
    markAllRead: "Tandai dibaca",
    markRead: "Tandai dibaca",
    settings: "Pengaturan notifikasi",
    unreadLabel: "Notifikasi belum dibaca",
    empty: "Tidak ada notifikasi baru.",
    loading: "Memuat notifikasi...",
    error: "Gagal memuat notifikasi.",
    justNow: "Baru saja",
    minutesAgo: (n) => `${n} menit lalu`,
    hoursAgo: (n) => `${n} jam lalu`,
    daysAgo: (n) => `${n} hari lalu`,
  },
};

const formatRelativeTime = (isoDate: string, copy: NotificationCopy) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) return copy.justNow;
  if (diffMinutes < 60) return copy.minutesAgo(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return copy.hoursAgo(diffHours);

  const diffDays = Math.floor(diffHours / 24);
  return copy.daysAgo(diffDays);
};

export function TopNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const auth = useOptionalAuth();
  const userId = auth?.user?.id;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notificationCopy = NOTIFICATION_COPY[language];
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const currentLabel = routeLabels[language][pathname]
    || routeLabels[language][Object.keys(routeLabels[language]).find(key => pathname.startsWith(key) && key !== "/") || ""]
    || (language === "id" ? "Halaman" : "Page");

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setIsLoadingNotifications(true);
    setNotificationError(false);

    try {
      const response = await fetch(`/api/v1/users/${userId}/notifications`);
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error("Failed to fetch notifications");

      setNotifications(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotificationError(true);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: number) => {
    if (!userId) return;

    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, isRead: true } : item)),
    );

    try {
      const response = await fetch(`/api/v1/users/${userId}/notifications/${notificationId}`, {
        method: "POST",
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error("Failed to mark notification as read");
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, [userId]);

  const markAllAsRead = useCallback(() => {
    notifications.filter((item) => !item.isRead).forEach((item) => {
      void markAsRead(item.id);
    });
  }, [notifications, markAsRead]);

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
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {notificationCopy.markAllRead}
                  </button>
                )}
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
              {isLoadingNotifications ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">{notificationCopy.loading}</p>
              ) : notificationError ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">{notificationCopy.error}</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted-foreground">{notificationCopy.empty}</p>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`border-b px-4 py-3 last:border-b-0 ${item.isRead ? "" : "bg-primary/5"}`}
                  >
                    <p className="text-sm font-medium leading-snug text-foreground">{item.message}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {formatRelativeTime(item.createdAt, notificationCopy)}
                    </p>
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        {notificationCopy.markRead}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
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
