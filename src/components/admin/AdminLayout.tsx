import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4 bg-background">
            <SidebarTrigger />
            <h2 className="text-lg font-semibold text-foreground">Admin Panel</h2>
          </header>
          <main className="flex-1 p-6 bg-secondary/30">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
