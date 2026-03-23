import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { Order } from "@/hooks/useOrders";
import type { CourierOrder, CourierProvider } from "@/hooks/useCourier";
import { getTemplateStyle, generateMemoHtml } from "@/lib/memoTemplates";

interface MemoPrintProps {
  order: Order;
  courierOrder?: CourierOrder | null;
  courierProvider?: CourierProvider | null;
  orderItems?: any[];
}

export function MemoPrint({ order, courierOrder, courierProvider, orderItems }: MemoPrintProps) {
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name || "STORE";
  const siteLogo = settings?.site_logo || "";
  const posMode = settings?.memo_pos_mode === "true";
  const templateId = posMode ? "6" : (settings?.active_memo_template || "1");

  const handlePrint = () => {
    const itemsTotal = orderItems?.reduce((sum: number, it: any) => sum + (it.total_price || 0), 0) || order.product_cost || 0;

    const courier = courierProvider ? {
      provider_name: courierProvider.name,
      tracking_id: courierOrder?.tracking_id,
      consignment_id: courierOrder?.consignment_id,
      courier_status: courierOrder?.courier_status,
    } : null;

    const memoHtml = generateMemoHtml(templateId, {
      order, items: orderItems || [], courier, siteName, siteLogo, itemsTotal,
    });

    const style = getTemplateStyle(templateId);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const favicon = siteLogo || document.querySelector('link[rel="icon"]')?.getAttribute('href') || '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Memo - ${order.order_number}</title>
        ${favicon ? `<link rel="icon" href="${favicon}">` : ''}
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>${style}</style>
      </head><body>${memoHtml}</body></html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 300);
  };

  return (
    <Button size="sm" variant="outline" onClick={handlePrint}>
      <Printer className="h-4 w-4 mr-1" /> Print Memo
    </Button>
  );
}
