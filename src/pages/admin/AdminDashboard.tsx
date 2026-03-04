import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserCheck } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

const AdminDashboard = () => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const { count: profileCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      setTotalUsers(profileCount || 0);

      const { count: adminCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      setTotalAdmins(adminCount || 0);
    };
    fetchStats();
  }, []);

  const stats = [
    { title: "মোট ইউজার", value: totalUsers, icon: Users, color: "text-primary" },
    { title: "অ্যাডমিন", value: totalAdmins, icon: Shield, color: "text-accent-foreground" },
    { title: "অ্যাক্টিভ", value: totalUsers, icon: UserCheck, color: "text-primary" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ড্যাশবোর্ড</h1>
          <p className="text-muted-foreground">অ্যাডমিন প্যানেল ওভারভিউ</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
