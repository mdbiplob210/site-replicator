import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

// Finance Sources
export function useFinanceSources(type?: string) {
  return useQuery({
    queryKey: ["finance-sources", type],
    queryFn: async () => {
      let query = supabase
        .from("finance_sources" as any)
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useCreateFinanceSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: { name: string; type: string }) => {
      const { data, error } = await supabase
        .from("finance_sources" as any)
        .insert(source)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-sources"] });
      toast.success("Source added!");
    },
    onError: (error: Error) => {
      toast.error("Failed to add source: " + error.message);
    },
  });
}

export function useDeleteFinanceSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_sources" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-sources"] });
      toast.success("Source deleted!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}

export type FinanceRecord = Tables<"finance_records">;
export type FinanceRecordInsert = TablesInsert<"finance_records">;

export function useFinanceRecords(typeFilter?: string) {
  return useQuery({
    queryKey: ["finance-records", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("finance_records")
        .select("*")
        .order("created_at", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinanceRecord[];
    },
  });
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_records")
        .select("type, amount");
      if (error) throw error;

      const records = data as FinanceRecord[];
      let moneyIn = 0, moneyOut = 0, totalLoan = 0, totalInvestment = 0, bankBalance = 0;

      for (const r of records) {
        const amt = Number(r.amount);
        switch (r.type) {
          case "income":
            moneyIn += amt;
            break;
          case "expense":
          case "product_purchase":
            moneyOut += amt;
            break;
          case "loan_in":
            totalLoan += amt;
            moneyIn += amt;
            break;
          case "loan_out":
            totalLoan -= amt;
            moneyOut += amt;
            break;
          case "investment_in":
            totalInvestment += amt;
            moneyIn += amt;
            break;
          case "investment_out":
            totalInvestment -= amt;
            moneyOut += amt;
            break;
          case "bank":
            bankBalance += amt;
            break;
        }
      }

      return { moneyIn, moneyOut, totalLoan, totalInvestment, bankBalance, profit: moneyIn - moneyOut };
    },
  });
}

export function useCreateFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: FinanceRecordInsert) => {
      const { data, error } = await supabase
        .from("finance_records")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-records"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-finance"] });
      toast.success("Record saved successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to save: " + error.message);
    },
  });
}

export function useDeleteFinanceRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-records"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-finance"] });
      toast.success("Record deleted!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
