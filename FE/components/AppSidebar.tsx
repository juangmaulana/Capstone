import {
  LayoutDashboard,
  Map,
  BarChart3,
  Brain,
  Database,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const NAV_COPY = {
  en: {
    subtitle: "IAS Monitoring",
    main: "Main",
    system: "System",
    toggle: "Toggle sidebar",
    items: {
      dashboard: "Dashboard",
      map: "Map Explorer",
      analytics: "Analytics",
      modeling: "Prediction (SDM)",
      data: "Data Explorer",
      admin: "Admin",
    },
  },
  id: {
    subtitle: "Pemantauan IAS",
    main: "Utama",
    system: "Sistem",
    toggle: "Buka/tutup sidebar",
    items: {
      dashboard: "Dasbor",
      map: "Penjelajah Peta",
      analytics: "Analitik",
      modeling: "Prediksi (SDM)",
      data: "Penjelajah Data",
      admin: "Admin",
    },
  },
} as const;

const mainItems = [
  { key: "dashboard", url: "/", icon: LayoutDashboard },
  { key: "map", url: "/map", icon: Map },
  { key: "analytics", url: "/analytics", icon: BarChart3 },
  { key: "modeling", url: "/modeling", icon: Brain },
  { key: "data", url: "/data", icon: Database },
] as const;

const systemItems = [
  { key: "admin", url: "/admin", icon: Shield },
] as const;

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const { language } = useLanguage();
  const copy = NAV_COPY[language];

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-4 transition-all">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              toggleSidebar();
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 transition-colors focus:outline-none"
            aria-label={copy.toggle}
          >
            <Image
              src="/Bio-Inspector-Logo-Only.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </button>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-accent-foreground">
                  Bio-Inspector
                </span>
                <span className="text-[11px] text-sidebar-muted">
                  {copy.subtitle}
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            {copy.main}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={copy.items[item.key]}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{copy.items[item.key]}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            {copy.system}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={copy.items[item.key]}
                  >
                    <NavLink
                      to={item.url}
                      className="transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{copy.items[item.key]}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4 group-data-[collapsible=icon]:p-2 transition-all">
        {!collapsed && (
          <p className="text-[11px] text-sidebar-muted min-w-max">v1.0.0 • Bio-Inspector</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
