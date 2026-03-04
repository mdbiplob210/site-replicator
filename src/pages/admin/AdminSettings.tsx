import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const AdminSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">সেটিংস</h1>
          <p className="text-muted-foreground">সিস্টেম সেটিংস কনফিগার করুন</p>
        </div>

        <Card className="border-border/60 max-w-xl">
          <CardHeader>
            <CardTitle className="text-lg">সাধারণ সেটিংস</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">ইমেইল ভেরিফিকেশন</Label>
                <p className="text-sm text-muted-foreground">নতুন ইউজারদের ইমেইল ভেরিফাই করতে হবে</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">নতুন রেজিস্ট্রেশন</Label>
                <p className="text-sm text-muted-foreground">নতুন ইউজার রেজিস্ট্রেশন অনুমতি দিন</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-foreground">মেইনটেনেন্স মোড</Label>
                <p className="text-sm text-muted-foreground">সাইট মেইনটেনেন্স মোডে রাখুন</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
