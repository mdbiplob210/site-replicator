import { supabase } from "@/integrations/supabase/client";

function getDurationHours(duration: string): number {
  switch (duration) {
    case "1h": return 1;
    case "6h": return 6;
    case "12h": return 12;
    case "24h": return 24;
    case "48h": return 48;
    case "72h": return 72;
    default: return 24;
  }
}

export interface FraudCheckResult {
  blocked: boolean;
  message: string;
  reason?: string;
}

export async function checkFraudProtection(
  customerPhone: string,
  clientIp: string,
  deviceInfo: string
): Promise<FraudCheckResult> {
  try {
    // Load fraud settings
    const { data: fraudSettings } = await supabase
      .from("fraud_settings")
      .select("*")
      .limit(1)
      .single();

    if (!fraudSettings) return { blocked: false, message: "" };

    const blockPopupMessage = fraudSettings.block_popup_message || "আপনি ইতিমধ্যে একটি অর্ডার করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।";

    // Check permanent phone block
    const { data: phoneBlocked } = await supabase
      .from("blocked_phones")
      .select("id")
      .eq("phone_number", customerPhone)
      .limit(1);

    if (phoneBlocked && phoneBlocked.length > 0) {
      return { blocked: true, message: blockPopupMessage, reason: `স্থায়ীভাবে ব্লক করা নম্বর: ${customerPhone}` };
    }

    // Check permanent IP block
    if (clientIp && clientIp !== "unknown") {
      const { data: ipBlocked } = await supabase
        .from("blocked_ips")
        .select("id")
        .eq("ip_address", clientIp)
        .limit(1);

      if (ipBlocked && ipBlocked.length > 0) {
        return { blocked: true, message: blockPopupMessage, reason: `স্থায়ীভাবে ব্লক করা IP: ${clientIp}` };
      }
    }

    // Protection mode checks
    if (!fraudSettings.protection_enabled || fraudSettings.repeat_block_duration === "off") {
      return { blocked: false, message: "" };
    }

    const hours = getDurationHours(fraudSettings.repeat_block_duration);
    const windowAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Check by phone
    const { data: recentPhoneOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_phone", customerPhone)
      .gte("created_at", windowAgo)
      .limit(1);

    if (recentPhoneOrders && recentPhoneOrders.length > 0) {
      return { blocked: true, message: blockPopupMessage, reason: `একই ফোন (${customerPhone}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে` };
    }

    // Check by IP
    if (clientIp && clientIp !== "unknown") {
      const { data: recentIpOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("client_ip", clientIp)
        .gte("created_at", windowAgo)
        .limit(1);

      if (recentIpOrders && recentIpOrders.length > 0) {
        return { blocked: true, message: blockPopupMessage, reason: `একই IP (${clientIp}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে` };
      }
    }

    // Check by device fingerprint
    if (fraudSettings.device_fingerprint_enabled && deviceInfo) {
      const { data: deviceOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("device_info", deviceInfo)
        .gte("created_at", windowAgo)
        .limit(1);

      if (deviceOrders && deviceOrders.length > 0) {
        return { blocked: true, message: blockPopupMessage, reason: `একই ডিভাইস থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে` };
      }
    }

    // Delivery ratio check
    if (fraudSettings.delivery_ratio_enabled && fraudSettings.min_delivery_ratio > 0) {
      const { data: customerOrders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("customer_phone", customerPhone);

      if (customerOrders && customerOrders.length >= 3) {
        const delivered = customerOrders.filter(o => o.status === "delivered").length;
        const ratio = Math.round((delivered / customerOrders.length) * 100);
        if (ratio < fraudSettings.min_delivery_ratio) {
          return { blocked: true, message: blockPopupMessage, reason: `ডেলিভারি রেশিও কম (${ratio}% < ${fraudSettings.min_delivery_ratio}%)` };
        }
      }
    }

    return { blocked: false, message: "" };
  } catch (err) {
    console.error("Fraud check error:", err);
    return { blocked: false, message: "" };
  }
}
