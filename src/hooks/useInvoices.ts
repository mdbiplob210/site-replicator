import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type InvoiceItem = {
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_id: string;
  courier_provider_id: string | null;
  courier_tracking_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  subtotal: number;
  delivery_charge: number;
  discount: number;
  cod_amount: number;
  total_amount: number;
  delivery_date: string | null;
  status: string;
  notes: string | null;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
};

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Invoice[];
    },
  });
}

export function useInvoiceByOrder(orderId?: string) {
  return useQuery({
    queryKey: ["invoice", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices" as any)
        .select("*")
        .eq("order_id", orderId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Invoice | null;
    },
    enabled: !!orderId,
  });
}
