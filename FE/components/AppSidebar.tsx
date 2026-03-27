import {
  LayoutDashboard,
  Map,
  BarChart3,
  Brain,
  Database,
  Shield,
  Leaf,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

const mainItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Map Explorer", url: "/map", icon: Map },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Prediction (SDM)", url: "/modeling", icon: Brain },
  { title: "Data Explorer", url: "/data", icon: Database },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

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
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/80 transition-colors focus:outline-none"
            aria-label="Toggle Sidebar"
          >
            <Leaf className="h-4 w-4" />
          </button>
          {!collapsed && (
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-accent-foreground">
                  BioWatch
                </span>
                <span className="text-[11px] text-sidebar-muted">
                  IAS Monitoring
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-muted">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
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
          <p className="text-[11px] text-sidebar-muted min-w-max">v1.0.0 • BioWatch</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
