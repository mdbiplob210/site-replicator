import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Products with inventory fields ──
export function useInventoryProducts() {
  return useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, stock_quantity, purchase_price, selling_price, low_stock_threshold, reorder_point, category_id, status")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

// ── Low stock products ──
export function useLowStockProducts() {
  return useQuery({
    queryKey: ["low-stock-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, stock_quantity, low_stock_threshold, reorder_point, purchase_price, selling_price")
        .eq("status", "active")
        .order("stock_quantity", { ascending: true });
      if (error) throw error;
      // Filter client-side: stock <= threshold
      return (data || []).filter(p => p.stock_quantity <= (p as any).low_stock_threshold);
    },
  });
}

// ── Update product inventory settings ──
export function useUpdateProductInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, low_stock_threshold, reorder_point }: { id: string; low_stock_threshold: number; reorder_point: number }) => {
      const { error } = await supabase
        .from("products")
        .update({ low_stock_threshold, reorder_point } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-products"] });
      toast.success("Inventory settings updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Stock Movements ──
export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ["stock-movements", productId],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (productId) query = query.eq("product_id", productId);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movement: {
      product_id: string;
      product_name: string;
      movement_type: string;
      quantity: number;
      previous_stock: number;
      new_stock: number;
      reference_id?: string;
      notes?: string;
    }) => {
      // 1. Insert movement record
      const { error: mvError } = await supabase
        .from("stock_movements" as any)
        .insert(movement as any);
      if (mvError) throw mvError;

      // 2. Update product stock
      const { error: pError } = await supabase
        .from("products")
        .update({ stock_quantity: movement.new_stock })
        .eq("id", movement.product_id);
      if (pError) throw pError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["inventory-products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-products"] });
      qc.invalidateQueries({ queryKey: ["finance-stock-value"] });
      toast.success("Stock updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Suppliers ──
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: { name: string; phone?: string; email?: string; address?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("suppliers" as any)
        .insert(supplier as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Stock Audits ──
export function useStockAudits() {
  return useQuery({
    queryKey: ["stock-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_audits" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateStockAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (audit: { notes?: string }) => {
      const { data, error } = await supabase
        .from("stock_audits" as any)
        .insert(audit as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-audits"] });
      toast.success("Audit created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStockAuditItems(auditId?: string) {
  return useQuery({
    queryKey: ["stock-audit-items", auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_audit_items" as any)
        .select("*")
        .eq("audit_id", auditId!)
        .order("product_name");
      if (error) throw error;
      return data as any[];
    },
    enabled: !!auditId,
  });
}

// ── Category-wise stock report ──
export function useCategoryStockReport() {
  return useQuery({
    queryKey: ["category-stock-report"],
    queryFn: async () => {
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("category_id, stock_quantity, purchase_price, selling_price, status")
        .eq("status", "active");
      if (pErr) throw pErr;

      const { data: categories, error: cErr } = await supabase
        .from("categories")
        .select("id, name");
      if (cErr) throw cErr;

      const catMap: Record<string, { name: string; totalStock: number; stockValue: number; potentialRevenue: number; productCount: number }> = {};
      const uncategorized = { name: "Uncategorized", totalStock: 0, stockValue: 0, potentialRevenue: 0, productCount: 0 };

      for (const cat of categories || []) {
        catMap[cat.id] = { name: cat.name, totalStock: 0, stockValue: 0, potentialRevenue: 0, productCount: 0 };
      }

      for (const p of products || []) {
        const target = p.category_id && catMap[p.category_id] ? catMap[p.category_id] : uncategorized;
        target.totalStock += p.stock_quantity;
        target.stockValue += p.stock_quantity * Number(p.purchase_price);
        target.potentialRevenue += p.stock_quantity * Number(p.selling_price);
        target.productCount += 1;
      }

      const result = Object.values(catMap).filter(c => c.productCount > 0);
      if (uncategorized.productCount > 0) result.push(uncategorized);
      return result.sort((a, b) => b.stockValue - a.stockValue);
    },
  });
}
