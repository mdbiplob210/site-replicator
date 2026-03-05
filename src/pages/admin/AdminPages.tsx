import { AdminLayout } from "@/components/admin/AdminLayout";
import { File, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminPages() {
  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <File className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pages</h1>
              <p className="text-sm text-muted-foreground">Manage custom pages for your store</p>
            </div>
          </div>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Create Page</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search pages..." className="pl-10" />
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <File className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No pages yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create custom pages like About, Contact, Terms etc.</p>
          <Button className="gap-2"><Plus className="h-4 w-4" /> Create Page</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
