import { useQuery } from "@tanstack/react-query";

export interface CourierBalance {
  provider_id: string;
  provider_name: string;
  slug: string;
  api_balance: number | null;
  estimated_balance: number;
  in_courier_amount: number;
  delivered_amount: number;
  error: string | null;
}

export function useCourierBalance() {
  return useQuery({
    queryKey: ["courier-balance"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/courier-balance`;
      const resp = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Balance fetch failed: ${err}`);
      }
      const result = await resp.json();
      return (result.data || []) as CourierBalance[];
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}
