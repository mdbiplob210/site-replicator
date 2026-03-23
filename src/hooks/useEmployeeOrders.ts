import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Returns the set of order IDs assigned to the current employee.
 * Admins get null (meaning "show all").
 */
export function useEmployeeAssignedOrderIds() {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ["employee-assigned-order-ids", user?.id],
    queryFn: async () => {
      if (isAdmin) return null; // admin sees everything

      const { data, error } = await supabase
        .from("order_assignments")
        .select("order_id")
        .eq("assigned_to", user!.id);

      if (error) throw error;
      return new Set((data || []).map((a) => a.order_id));
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });
}

/**
 * Returns whether the current user is an employee (non-admin with a role).
 */
export function useIsEmployee() {
  const { isAdmin, userRoles } = useAuth();
  return !isAdmin && userRoles.length > 0;
}
