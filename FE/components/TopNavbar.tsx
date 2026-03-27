import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/map": "Map Explorer",
  "/analytics": "Analytics",
  "/modeling": "Modeling (SDM)",
  "/data": "Data Explorer",
  "/reports": "Reports",
};

export function TopNavbar() {
  const pathname = usePathname();
  const currentLabel = routeLabels[pathname] || "Page";

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
    </header>
  );
}
