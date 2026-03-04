import {
  LayoutDashboard, ShoppingCart, Package, Globe, FileText, Wallet,
  Lightbulb, ListChecks, BarChart3, Megaphone, Zap, Database,
  Users, HeadphonesIcon, Sparkles, CreditCard, LogOut, ChevronDown, Camera
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const mainMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Website", url: "/admin/website", icon: Globe, hasSubmenu: true },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Finance", url: "/admin/finance", icon: Wallet },
  { title: "Planning", url: "/admin/planning", icon: Lightbulb },
  { title: "Tasks", url: "/admin/tasks", icon: ListChecks },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3, hasSubmenu: true },
];

const bottomMenuItems = [
  { title: "Meta Ads", url: "/admin/meta-ads", icon: Megaphone },
  { title: "Automation", url: "/admin/automation", icon: Zap },
  { title: "Backup", url: "/admin/backup", icon: Database },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Support", url: "/admin/support", icon: HeadphonesIcon },
  { title: "Coming Soon", url: "/admin/coming-soon", icon: Sparkles },
  { title: "Plan", url: "/admin/plan", icon: CreditCard },
  { title: "Screenshots", url: "/admin/screenshots", icon: Camera },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user } = useAuth();

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = userName.charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/50">
      <SidebarContent className="bg-sidebar-background">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-sidebar-border/50">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                S
              </div>
              <div>
                <p className="text-sm font-bold text-sidebar-foreground tracking-tight">Quick-shopbd</p>
                <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">SOHOZ PRO v1.1</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20">
                S
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-bold px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
                      activeClassName="sidebar-active-indicator bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}
                      {!collapsed && item.hasSubmenu && (
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="mx-4 my-1 border-t border-sidebar-border/40" />

        {/* Bottom Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-bold px-4">
            More
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60 transition-all duration-200"
                      activeClassName="sidebar-active-indicator bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar-background p-2">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/40 transition-colors">
          <Avatar className="h-9 w-9 ring-2 ring-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-[11px] text-muted-foreground font-medium">Admin</span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
