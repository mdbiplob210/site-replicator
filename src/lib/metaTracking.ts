import type { Tables } from "@/integrations/supabase/types";

export type MetaTrackableOrderStatus = Tables<"orders">["status"];

export function mapOrderStatusToMetaEvent(status: MetaTrackableOrderStatus): string | null {
  switch (status) {
    case "delivered":
      return "OrderDelivered";
    case "cancelled":
      return "CancelOrder";
    case "returned":
      return "ReturnOrder";
    default:
      return null;
  }
}