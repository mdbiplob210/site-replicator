import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface AdminPlaceholderProps {
  title: string;
  description?: string;
}

const AdminPlaceholder = ({ title, description }: AdminPlaceholderProps) => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
        <Card className="p-12 text-center border-border/40">
          <Construction className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Coming Soon</p>
          <p className="text-sm text-muted-foreground/70 mt-1">This section is under development</p>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPlaceholder;
