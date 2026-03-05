import { AdminLayout } from "@/components/admin/AdminLayout";
import { Layers, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLandingPages() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Layers className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Landing Pages</h1>
              <p className="text-sm text-muted-foreground">Create high-converting landing pages</p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create New
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search landing pages..." className="pl-10" />
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Layers className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No landing pages yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first landing page to start converting</p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create New
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
