import { useCallback } from "react";
import { toast } from "sonner";
import type { Order } from "@/hooks/useOrders";
import { getTemplateStyle, generateMemoHtml } from "@/lib/memoTemplates";

interface CourierInfo {
  provider_name: string;
  logo_url?: string;
  tracking_id?: string;
  consignment_id?: string;
  courier_status?: string;
}

interface BulkMemoPrintProps {
  orders: Order[];
  courierByOrderId: Record<string, CourierInfo>;
  orderItemsByOrderId: Record<string, any[]>;
  siteName?: string;
  siteLogo?: string;
  onPrinted: (orderIds: string[]) => void;
  templateId?: string;
}

// Bulk print styles for A4 (3 per page grid)
const BULK_PAGE_STYLES = `
  @page { size: A4; margin: 0; }
  html, body { margin: 0; padding: 0; width: 210mm; }
  .page-container {
    display: flex;
    flex-direction: column;
    width: 210mm;
    height: 297mm;
    page-break-after: always;
    overflow: hidden;
  }
  .page-container:last-child { page-break-after: auto; }
  .page-container > * {
    flex: 1 1 0;
    width: 100%;
    overflow: hidden;
    border-bottom: 1px dashed #ccc;
  }
  .page-container > *:last-child { border-bottom: none; }
  .page-container .memo {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;

export function useBulkMemoPrint({ orders, courierByOrderId, orderItemsByOrderId, siteName = "STORE", siteLogo, onPrinted, templateId = "1" }: BulkMemoPrintProps) {
  const handleBulkPrint = useCallback(async () => {
    if (orders.length === 0) return;

    const isPOS = templateId === "6";
    const orderIds = orders.map(o => o.id);
    const style = getTemplateStyle(templateId);

    const memos = orders.map((order) => {
      const courier = courierByOrderId[order.id] || null;
      const items = orderItemsByOrderId[order.id] || [];
      const itemsTotal = items.reduce((s: number, it: any) => s + (it.total_price || 0), 0) || (order as any).product_cost || 0;

      return generateMemoHtml(templateId, { order, items, courier, siteName, siteLogo, itemsTotal });
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Could not open print window"); return; }

    let bodyContent: string;
    if (isPOS) {
      // POS: stack receipts vertically with page breaks
      bodyContent = memos.map((m, i) =>
        `<div style="page-break-after:${i < memos.length - 1 ? 'always' : 'auto'}">${m}</div>`
      ).join('');
    } else {
      // A4: 3 per page grid
      const pages: string[] = [];
      for (let i = 0; i < memos.length; i += 3) {
        const pageMemos = memos.slice(i, i + 3);
        while (pageMemos.length < 3) pageMemos.push('<div></div>');
        pages.push(`<div class="page-container">${pageMemos.join('')}</div>`);
      }
      bodyContent = pages.join('');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Memo Print - ${orders.length} Orders</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>${style}${isPOS ? '' : BULK_PAGE_STYLES}</style>
      </head><body>${bodyContent}</body></html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        onPrinted(orderIds);
        printWindow.close();
      };
    }, 300);
  }, [orders, courierByOrderId, orderItemsByOrderId, siteName, siteLogo, onPrinted, templateId]);

  return { handleBulkPrint };
}
