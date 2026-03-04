import { ReactNode, useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import {
  Search, Sun, ExternalLink, Bell, MessageSquare,
  LayoutDashboard, BarChart3, Wallet, Package, ShoppingCart,
  Plus, FileText, ListChecks, Lightbulb, Megaphone, Users,
  Globe, Settings, Zap, Database
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const searchPages = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Finance", url: "/admin/finance", icon: Wallet },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Add New Product", url: "/admin/products", icon: Plus },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Tasks", url: "/admin/tasks", icon: ListChecks },
  { title: "Planning", url: "/admin/planning", icon: Lightbulb },
  { title: "Meta Ads", url: "/admin/meta-ads", icon: Megaphone },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Website Settings", url: "/admin/website/settings", icon: Settings },
  { title: "Website", url: "/admin/website", icon: Globe },
  { title: "Automation", url: "/admin/automation", icon: Zap },
  { title: "Backup", url: "/admin/backup", icon: Database },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [searchOpen]);

  const filtered = searchPages.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase())
  );

  const goTo = (url: string) => {
    navigate(url);
    setSearchOpen(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 flex items-center border-b border-border/40 px-4 gap-3 bg-card/90 glass sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="flex-1" />
            {/* Search Trigger */}
            <div
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2.5 bg-secondary/70 rounded-xl px-4 py-2 border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group relative"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm text-muted-foreground">Search...</span>
              <kbd className="ml-6 text-[10px] bg-card px-2 py-0.5 rounded-md text-muted-foreground/60 border border-border/60 font-mono">⌘K</kbd>
            </div>
            <div className="flex items-center gap-0.5">
              <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                <Sun className="h-[18px] w-[18px]" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                <ExternalLink className="h-[18px] w-[18px]" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(187,85%,53%)] ring-2 ring-card" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all">
                <MessageSquare className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>

          {/* Search Dropdown */}
          {searchOpen && (
            <>
              <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setSearchOpen(false)} />
              <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search orders, products, pages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">Pages</p>
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
                  )}
                  {filtered.map((page) => (
                    <button
                      key={page.title}
                      onClick={() => goTo(page.url)}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <page.icon className="h-4 w-4 text-muted-foreground" />
                      {page.title}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <main className="flex-1 p-6 overflow-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
