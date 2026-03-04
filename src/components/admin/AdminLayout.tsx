import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Search, Sun, ExternalLink, Bell, MessageSquare } from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 flex items-center border-b border-border/50 px-4 gap-3 bg-card/80 glass sticky top-0 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1" />
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-secondary/80 rounded-xl px-3.5 py-2 border border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search...</span>
              <kbd className="ml-6 text-[10px] bg-background/80 px-1.5 py-0.5 rounded text-muted-foreground border border-border/60 font-mono">⌘K</kbd>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all">
                <Sun className="h-[18px] w-[18px]" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all">
                <ExternalLink className="h-[18px] w-[18px]" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all relative">
                <Bell className="h-[18px] w-[18px]" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
              </button>
              <button className="p-2.5 rounded-xl hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all">
                <MessageSquare className="h-[18px] w-[18px]" />
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto scrollbar-thin">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
