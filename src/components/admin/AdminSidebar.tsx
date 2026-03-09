import { useState } from "react";
import {
  LayoutDashboard, ShoppingCart, Package, Globe, FileText, Wallet,
  Lightbulb, ListChecks, BarChart3, Megaphone, Zap, Database,
  Users, HeadphonesIcon, Sparkles, CreditCard, LogOut, ChevronDown,
  Layout, ShoppingBag, Gift, Grid3X3, Heart, Layers, CreditCard as PaymentIcon,
  File, Settings, PieChart, UserCog
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth, ROLE_DISPLAY_NAMES } from "@/contexts/AuthContext";
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

const websiteSubItems = [
  { title: "Main Template", url: "/admin/website/main-template", icon: Layout },
  { title: "Checkout Template", url: "/admin/website/checkout-template", icon: ShoppingBag },
  { title: "Product Template", url: "/admin/website/product-template", icon: Gift },
  { title: "Category Template", url: "/admin/website/category-template", icon: Grid3X3 },
  { title: "Thank You Template", url: "/admin/website/thank-you", icon: Heart },
  { title: "Landing Pages", url: "/admin/website/landing-pages", icon: Layers },
  { title: "Payment", url: "/admin/website/payment", icon: PaymentIcon },
  { title: "Pages", url: "/admin/website/pages", icon: File },
  { title: "LP Analytics", url: "/admin/website/landing-pages/analytics", icon: PieChart },
  { title: "Settings", url: "/admin/website/settings", icon: Settings },
];

const mainMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Website", url: "/admin/website", icon: Globe, hasSubmenu: true, subItems: websiteSubItems },
  { title: "Invoices", url: "/admin/invoices", icon: FileText },
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
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, user, isAdmin, userRoles } = useAuth();

  // Role-based menu filtering
  const hasRole = (role: string) => userRoles.includes(role as any);
  const canSeeOrders = isAdmin || hasRole("manager") || hasRole("moderator") || hasRole("user");
  const canSeeProducts = isAdmin || hasRole("manager") || hasRole("moderator");
  const canSeeWebsite = isAdmin;
  const canSeeReports = isAdmin;
  const canSeeFinance = isAdmin || hasRole("accounting");
  const canSeePlanning = isAdmin;
  const canSeeTasks = isAdmin || hasRole("manager") || hasRole("moderator");
  const canSeeAnalytics = isAdmin || hasRole("ad_analytics");
  const canSeeMetaAds = isAdmin || hasRole("ad_analytics");
  const canSeeAutomation = isAdmin;
  const canSeeBackup = isAdmin;
  const canSeeUsers = isAdmin;

  const filteredMainMenu = mainMenuItems.filter((item) => {
    if (item.title === "Dashboard") return true; // everyone sees dashboard
    if (item.title === "Orders") return canSeeOrders;
    if (item.title === "Products") return canSeeProducts;
    if (item.title === "Website") return canSeeWebsite;
    if (item.title === "Invoices") return isAdmin || hasRole("accounting");
    if (item.title === "Reports") return canSeeReports;
    if (item.title === "Finance") return canSeeFinance;
    if (item.title === "Planning") return canSeePlanning;
    if (item.title === "Tasks") return canSeeTasks;
    if (item.title === "Analytics") return canSeeAnalytics;
    return true;
  });

  const filteredBottomMenu = bottomMenuItems.filter((item) => {
    if (item.title === "Meta Ads") return canSeeMetaAds;
    if (item.title === "Automation") return canSeeAutomation;
    if (item.title === "Backup") return canSeeBackup;
    if (item.title === "Users") return canSeeUsers;
    return isAdmin; // Support, Coming Soon, Plan - admin only
  });

  const primaryRole = userRoles[0];
  const roleDisplayName = primaryRole ? ROLE_DISPLAY_NAMES[primaryRole] || primaryRole : "User";

  const isWebsiteActive = location.pathname.startsWith("/admin/website");
  const [websiteOpen, setWebsiteOpen] = useState(isWebsiteActive);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = userName.charAt(0).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="sidebar-gradient">
        {/* Brand */}
        <div className="px-4 py-5 gradient-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(187,85%,53%)] to-[hsl(210,100%,50%)] text-white font-bold text-sm shadow-lg glow-cyan">
                S
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">Quick-shopbd</p>
                <p className="text-[10px] text-sidebar-foreground/50 font-semibold tracking-[0.2em] uppercase">QUICK SHOP BD v1.1</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(187,85%,53%)] to-[hsl(210,100%,50%)] text-white font-bold text-xs shadow-lg glow-cyan">
                S
              </div>
            </div>
          )}
        </div>

        {/* Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/30 font-bold px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {filteredMainMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <>
                      <SidebarMenuButton asChild>
                        <button
                          onClick={() => setWebsiteOpen(!websiteOpen)}
                          className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-200 ${
                            isWebsiteActive
                              ? "sidebar-active-indicator bg-sidebar-accent text-white font-semibold"
                              : "text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/80"
                          }`}
                        >
                          <item.icon className="h-[18px] w-[18px] shrink-0 group-hover:text-[hsl(187,85%,53%)] transition-colors" />
                          {!collapsed && (
                            <span className="flex-1 truncate text-left">{item.title}</span>
                          )}
                          {!collapsed && (
                            <ChevronDown className={`h-3.5 w-3.5 opacity-40 transition-transform duration-200 ${websiteOpen ? "rotate-180" : ""}`} />
                          )}
                        </button>
                      </SidebarMenuButton>
                      {/* Submenu */}
                      {websiteOpen && !collapsed && (
                        <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border/30 pl-3">
                          {item.subItems.map((sub) => (
                            <SidebarMenuItem key={sub.title}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={sub.url}
                                  className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/60 transition-all duration-200"
                                  activeClassName="text-white font-semibold bg-sidebar-accent/40"
                                >
                                  <sub.icon className="h-[15px] w-[15px] shrink-0" />
                                  <span className="truncate">{sub.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/80 transition-all duration-200"
                        activeClassName="sidebar-active-indicator bg-sidebar-accent text-white font-semibold"
                      >
                        <item.icon className="h-[18px] w-[18px] shrink-0 group-hover:text-[hsl(187,85%,53%)] transition-colors" />
                        {!collapsed && (
                          <span className="flex-1 truncate">{item.title}</span>
                        )}
                        {!collapsed && item.hasSubmenu && (
                          <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Divider */}
        <div className="mx-4 my-1.5 border-t border-sidebar-border/50" />

        {/* Bottom Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/30 font-bold px-4">
            More
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {filteredBottomMenu.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] text-sidebar-foreground/70 hover:text-white hover:bg-sidebar-accent/80 transition-all duration-200"
                      activeClassName="sidebar-active-indicator bg-sidebar-accent text-white font-semibold"
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0 group-hover:text-[hsl(187,85%,53%)] transition-colors" />
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
      <SidebarFooter className="border-t border-sidebar-border/50 sidebar-gradient p-2">
        <NavLink to="/admin/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/50 transition-all cursor-pointer">
          <Avatar className="h-9 w-9 ring-2 ring-[hsl(187,85%,53%)]/30">
            <AvatarFallback className="bg-gradient-to-br from-[hsl(187,85%,53%)]/20 to-[hsl(210,100%,50%)]/20 text-[hsl(187,85%,53%)] font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-[11px] text-sidebar-foreground/50 font-medium">{roleDisplayName}</span>
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); signOut(); }}
              className="p-2 rounded-lg hover:bg-red-500/10 text-sidebar-foreground/40 hover:text-red-400 transition-all duration-200"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </NavLink>
      </SidebarFooter>
    </Sidebar>
  );
}
