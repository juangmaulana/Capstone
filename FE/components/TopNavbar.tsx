import { ChevronRight, Languages } from "lucide-react";
import { usePathname } from "next/navigation";
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
    "/admin": "Admin",
  },
  id: {
    "/": "Dasbor",
    "/map": "Penjelajah Peta",
    "/analytics": "Analitik",
    "/modeling": "Pemodelan (SDM)",
    "/data": "Penjelajah Data",
    "/reports": "Laporan",
    "/admin": "Admin",
  },
};

export function TopNavbar() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const currentLabel = routeLabels[language][pathname]
    || routeLabels[language][Object.keys(routeLabels[language]).find(key => pathname.startsWith(key) && key !== "/") || ""]
    || (language === "id" ? "Halaman" : "Page");

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden sm:inline">BioWatch</span>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{currentLabel}</span>
      </nav>

      <div className="flex-1" />

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
