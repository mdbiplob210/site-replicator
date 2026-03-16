import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tag, Plus, Trash2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useToggleCoupon } from "@/hooks/useCoupons";
import { format } from "date-fns";

export default function AdminCoupons() {
  const { data: coupons = [], isLoading } = useCoupons();
  const createCoupon = useCreateCoupon();
  const deleteCoupon = useDeleteCoupon();
  const toggleCoupon = useToggleCoupon();

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const handleCreate = () => {
    if (!code.trim() || !discountValue) return;
    createCoupon.mutate({
      code: code.trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrder) || 0,
      max_uses: Number(maxUses) || 0,
      expires_at: expiresAt || null,
    }, {
      onSuccess: () => {
        setCode("");
        setDiscountValue("");
        setMinOrder("");
        setMaxUses("");
        setExpiresAt("");
      },
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Coupon Management</h1>
            <p className="text-sm text-muted-foreground">Create and manage discount coupons</p>
          </div>
        </div>

        {/* Create Form */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <p className="font-semibold text-foreground">Create New Coupon</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Code</label>
              <Input className="mt-1 uppercase font-mono" placeholder="e.g. SAVE50" value={code} onChange={e => setCode(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Discount Type</label>
              <Select value={discountType} onValueChange={setDiscountType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fixed (৳)</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Discount Value</label>
              <Input className="mt-1" type="number" placeholder="e.g. 50" value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Min Order (৳)</label>
              <Input className="mt-1" type="number" placeholder="0 = no min" value={minOrder} onChange={e => setMinOrder(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Max Uses</label>
              <Input className="mt-1" type="number" placeholder="0 = unlimited" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase">Expires At</label>
              <Input className="mt-1" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={createCoupon.isPending || !code.trim() || !discountValue} className="gap-2">
            {createCoupon.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create Coupon
          </Button>
        </div>

        {/* Coupons List */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <p className="font-semibold text-foreground mb-4">All Coupons ({coupons.length})</p>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : coupons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No coupons yet</p>
          ) : (
            <div className="space-y-2">
              {coupons.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-border/40 hover:bg-secondary/30 transition">
                  <div className="flex items-center gap-4">
                    <code className="text-sm font-bold font-mono bg-primary/10 text-primary px-3 py-1 rounded-lg">{c.code}</code>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`} off
                        {c.min_order_amount > 0 && ` (min ৳${c.min_order_amount})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Used: {c.used_count}{c.max_uses > 0 ? `/${c.max_uses}` : ""}
                        {c.expires_at && ` · Expires: ${format(new Date(c.expires_at), "dd MMM yyyy")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => toggleCoupon.mutate({ id: c.id, is_active: !c.is_active })}
                    >
                      {c.is_active ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCoupon.mutate(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
