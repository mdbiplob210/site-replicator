import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, UserCog } from "lucide-react";

const roles = [
  {
    name: "Admin",
    value: "admin",
    description: "পূর্ণ অ্যাক্সেস — সব ইউজার ও রোল ম্যানেজ করতে পারবে",
    icon: Shield,
    color: "bg-primary/10 text-primary",
  },
  {
    name: "Moderator",
    value: "moderator",
    description: "কন্টেন্ট মডারেশন ও রিপোর্ট ম্যানেজ করতে পারবে",
    icon: UserCog,
    color: "bg-accent text-accent-foreground",
  },
  {
    name: "User",
    value: "user",
    description: "সাধারণ ইউজার — নিজের ডাটা দেখতে ও আপডেট করতে পারবে",
    icon: Users,
    color: "bg-secondary text-secondary-foreground",
  },
];

const AdminRoles = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">রোল ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">সিস্টেমে ব্যবহৃত রোলগুলো</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.value} className="border-border/60">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{role.name}</CardTitle>
                  <Badge variant="outline" className="text-xs mt-1">{role.value}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRoles;
