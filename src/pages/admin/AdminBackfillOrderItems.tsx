import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Search, Package, CheckCircle2, Loader2, Plus, X, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { usePublicProducts } from "@/hooks/usePublicProducts";

type ItemDraft = {
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export default function AdminBackfillOrderItems() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([]);

  // Fetch all orders
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["backfill_orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, customer_name, total_amount, product_cost, created_at, status")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing order_items counts
  const { data: itemCounts = {} } = useQuery({
    queryKey: ["backfill_item_counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items" as any)
        .select("order_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of (data || []) as any[]) {
        counts[row.order_id] = (counts[row.order_id] || 0) + 1;
      }
      return counts;
    },
  });

  const { data: allProducts = [] } = usePublicProducts();

  // Orders without items
  const unmappedOrders = useMemo(() => {
    return allOrders.filter((o) => !itemCounts[o.id]);
  }, [allOrders, itemCounts]);

  const filteredOrders = useMemo(() => {
    const list = unmappedOrders;
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((o) =>
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q)
    );
  }, [unmappedOrders, search]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return allProducts.slice(0, 8);
    const q = productSearch.toLowerCase();
    return allProducts.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.product_code.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [allProducts, productSearch]);

  const selectedOrder = allOrders.find((o) => o.id === selectedOrderId);

  const addProduct = (p: any) => {
    const existing = items.find((i) => i.product_id === p.id);
    if (existing) {
      setItems(items.map((i) =>
        i.product_id === p.id
          ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price }
          : i
      ));
    } else {
      setItems([...items, {
        product_id: p.id,
        product_name: p.name,
        product_code: p.product_code,
        quantity: 1,
        unit_price: Number(p.selling_price),
        total_price: Number(p.selling_price),
      }]);
    }
    setProductSearch("");
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty <= 0) { setItems(items.filter((_, i) => i !== idx)); return; }
    setItems(items.map((item, i) =>
      i === idx ? { ...item, quantity: qty, total_price: qty * item.unit_price } : item
    ));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrderId || items.length === 0) throw new Error("No items");
      const rows = items.map((item) => ({
        order_id: selectedOrderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));
      const { error } = await supabase.from("order_items" as any).insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backfill_item_counts"] });
      queryClient.invalidateQueries({ queryKey: ["order_items_for_ads"] });
      toast.success("আইটেম সফলভাবে সেভ হয়েছে!");
      setSelectedOrderId(null);
      setItems([]);
    },
    onError: (err: Error) => {
      toast.error("সেভ ব্যর্থ: " + err.message);
    },
  });

  // Bulk auto-map: try to match product_cost with selling_price
  const autoMapMutation = useMutation({
    mutationFn: async () => {
      let mapped = 0;
      for (const order of unmappedOrders) {
        const cost = Number(order.product_cost);
        if (cost <= 0) continue;

        // Try exact match with a product selling_price
        const matchedProduct = allProducts.find((p: any) => Number(p.selling_price) === cost);
        if (matchedProduct) {
          const row = {
            order_id: order.id,
            product_id: (matchedProduct as any).id,
            product_name: (matchedProduct as any).name,
            product_code: (matchedProduct as any).product_code,
            quantity: 1,
            unit_price: cost,
            total_price: cost,
          };
          const { error } = await supabase.from("order_items" as any).insert([row] as any);
          if (!error) mapped++;
        }
      }
      return mapped;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["backfill_item_counts"] });
      toast.success(`${count}টি অর্ডার অটো-ম্যাপ হয়েছে!`);
    },
    onError: (err: Error) => {
      toast.error("অটো-ম্যাপ ব্যর্থ: " + err.message);
    },
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin/orders" className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Order Items Backfill</h1>
              <p className="text-sm text-muted-foreground">
                এক্সিস্টিং অর্ডারে প্রোডাক্ট আইটেম যোগ করুন
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => autoMapMutation.mutate()}
              disabled={autoMapMutation.isPending || unmappedOrders.length === 0}
            >
              {autoMapMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Auto-Map ({unmappedOrders.length})
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold text-foreground">{allOrders.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs text-muted-foreground">With Items ✓</p>
            <p className="text-2xl font-bold text-green-600">{allOrders.length - unmappedOrders.length}</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Without Items</p>
            <p className="text-2xl font-bold text-orange-600">{unmappedOrders.length}</p>
          </div>
        </div>

        {/* Selected order detail */}
        {selectedOrder ? (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">{selectedOrder.order_number}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.customer_name} · ৳{Number(selectedOrder.total_amount).toLocaleString()} · Product Cost: ৳{Number(selectedOrder.product_cost).toLocaleString()}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setSelectedOrderId(null); setItems([]); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Product search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="প্রোডাক্ট সার্চ করুন..."
                className="pl-10"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
            </div>

            {productSearch && filteredProducts.length > 0 && (
              <div className="border border-border rounded-xl max-h-40 overflow-y-auto bg-card shadow-md">
                {filteredProducts.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => addProduct(p)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors flex items-center justify-between text-sm border-b border-border/30 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-foreground">{p.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({p.product_code})</span>
                    </div>
                    <span className="text-xs font-semibold text-primary">৳{Number(p.selling_price).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Added items */}
            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">{item.product_code} · ৳{item.unit_price}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateQty(idx, item.quantity - 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">−</button>
                      <span className="w-8 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                      <button onClick={() => updateQty(idx, item.quantity + 1)} className="h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-secondary text-foreground">+</button>
                    </div>
                    <span className="text-sm font-semibold text-foreground w-20 text-right">৳{item.total_price.toLocaleString()}</span>
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">{items.length}টি আইটেম</span>
                  <span className="text-sm font-bold text-primary">৳{items.reduce((s, i) => s + i.total_price, 0).toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={() => saveMutation.mutate()}
              disabled={items.length === 0 || saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Items ({items.length})
            </Button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="অর্ডার নম্বর বা কাস্টমার নাম দিয়ে সার্চ..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Unmapped orders list */}
            {ordersLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-12 text-center">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-foreground">সব অর্ডারে আইটেম ম্যাপ করা হয়েছে!</p>
                <p className="text-sm text-muted-foreground mt-1">কোনো unmapped অর্ডার নেই</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="w-full text-left bg-card rounded-xl border border-border p-4 hover:bg-secondary/30 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name} · {new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground text-sm">৳{Number(order.total_amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Cost: ৳{Number(order.product_cost).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
