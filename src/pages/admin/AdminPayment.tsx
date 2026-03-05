import { AdminLayout } from "@/components/admin/AdminLayout";
import { CreditCard, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export default function AdminPayment() {
  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Payment Settings</h1>
              <p className="text-sm text-muted-foreground">Configure payment methods for your store</p>
            </div>
          </div>
          <Button className="gap-2"><Save className="h-4 w-4" /> Save</Button>
        </div>

        {/* COD */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Cash on Delivery (COD)</h3>
              <p className="text-sm text-muted-foreground mt-1">কাস্টমার ডেলিভারির সময় পেমেন্ট করবে</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>

        {/* bKash */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">bKash Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">bKash মোবাইল পেমেন্ট</p>
            </div>
            <Switch />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">bKash Number</label>
            <Input className="mt-1.5" placeholder="01XXXXXXXXX" />
          </div>
        </div>

        {/* Nagad */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-foreground">Nagad Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">Nagad মোবাইল পেমেন্ট</p>
            </div>
            <Switch />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Nagad Number</label>
            <Input className="mt-1.5" placeholder="01XXXXXXXXX" />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
