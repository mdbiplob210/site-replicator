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
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-background">
        {/* Brand */}
        <div className="px-4 py-5">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
                S
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Quick-shopbd</p>
                <p className="text-[11px] text-muted-foreground">SOHOZ PRO v1.1</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                S
              </div>
            </div>
          )}
        </div>

        {/* Menu Label */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-accent/50 rounded-xl transition-all duration-200 py-3 px-3"
                      activeClassName="bg-accent text-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && item.hasSubmenu && (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Menu Items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-accent/50 rounded-xl transition-all duration-200 py-3 px-3"
                      activeClassName="bg-accent text-accent-foreground font-semibold shadow-sm"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-border/40 bg-background">
        <div className="flex items-center gap-3 px-3 py-3">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Admin</span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={signOut}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
