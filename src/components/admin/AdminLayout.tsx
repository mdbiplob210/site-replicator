import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { Search, Sun, ExternalLink, Bell, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/20">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="h-14 flex items-center border-b border-border/40 px-4 gap-4 bg-background sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Search...</span>
              <kbd className="ml-4 text-[10px] bg-background px-1.5 py-0.5 rounded text-muted-foreground border border-border">⌘K</kbd>
            </div>
            <button className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground">
              <Sun className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground">
              <ExternalLink className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground relative">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-secondary/60 text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
            </button>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
