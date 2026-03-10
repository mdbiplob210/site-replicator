import { useCallback } from "react";
import { format } from "date-fns";
import type { Order } from "@/hooks/useOrders";
import { toast } from "sonner";

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
}

const BULK_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Noto Sans Bengali', sans-serif; font-size: 11px; color: #1a1a2e; }

  @page { size: A4; margin: 8mm; }

  .page-container {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 5mm;
    height: 100vh;
    page-break-after: always;
  }
  .page-container:last-child { page-break-after: auto; }

  .memo {
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #fff;
  }

  .memo-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: #fff; padding: 8px 14px;
    position: relative; overflow: hidden;
  }
  .memo-header::after {
    content: ''; position: absolute; top: -20px; right: -20px;
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(251,191,36,0.12);
  }
  .shop-name { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; }
  .shop-logo { height: 24px; width: auto; object-fit: contain; }
  .order-num { font-size: 15px; font-weight: 900; color: #fbbf24; }
  .order-date { font-size: 9px; color: #94a3b8; }

  .courier-section {
    background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
    border-bottom: 1px solid #bbf7d0;
    padding: 5px 14px;
  }
  .courier-badge {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white; padding: 2px 8px; border-radius: 20px;
    font-size: 9px; font-weight: 700;
  }
  .courier-status {
    font-size: 8px; font-weight: 700; text-transform: uppercase;
    color: #059669; letter-spacing: 0.5px;
    background: #d1fae5; padding: 1px 6px; border-radius: 8px;
  }
  .tracking-box {
    background: #fff; border: 1.5px dashed #a7f3d0; border-radius: 6px;
    padding: 5px 10px; text-align: center; margin-top: 5px;
  }
  .tracking-label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 15px; font-weight: 900; letter-spacing: 3px; color: #0f172a; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 32px; line-height: 1; }

  .section { padding: 5px 14px; border-bottom: 1px solid #f1f5f9; }
  .section-title {
    font-size: 8px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px;
  }
  .info-grid { display: grid; grid-template-columns: 55px 1fr; gap: 2px 6px; }
  .info-label { font-size: 9px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 10px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #2563eb; font-size: 11px; }

  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th {
    font-size: 8px; font-weight: 700; color: #94a3b8; padding: 3px 6px;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1.5px solid #e2e8f0; background: #f8fafc;
  }
  .items-table td { padding: 3px 6px; font-size: 10px; border-bottom: 1px solid #f1f5f9; }

  .totals-section { padding: 5px 14px 6px; background: #fafbfc; }
  .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total {
    font-size: 13px; font-weight: 900; color: #0f172a;
    margin-top: 4px; padding-top: 5px;
    border-top: 2px solid #1e293b;
  }

  .courier-note {
    background: linear-gradient(135deg, #fef3c7, #fffbeb);
    border-left: 3px solid #f59e0b;
    padding: 4px 10px; margin: 4px 10px; border-radius: 0 4px 4px 0;
    font-size: 9px; color: #92400e;
  }
  .staff-note { padding: 3px 14px; font-size: 9px; color: #64748b; background: #f8fafc; }

  .memo-footer {
    text-align: center; padding: 5px 14px;
    font-size: 8px; color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    margin-top: auto; background: #fafbfc;
  }
  .memo-footer .thank-you { font-weight: 700; color: #64748b; font-size: 9px; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function useBulkMemoPrint({ orders, courierByOrderId, orderItemsByOrderId, siteName = "STORE", siteLogo, onPrinted }: BulkMemoPrintProps) {
  const handleBulkPrint = useCallback(async () => {
    if (orders.length === 0) return;

    const orderIds = orders.map(o => o.id);

    const memos = orders.map((order) => {
      const courier = courierByOrderId[order.id];
      const items = orderItemsByOrderId[order.id] || [];

      const logoHtml = siteLogo
        ? `<img src="${siteLogo}" alt="${siteName}" class="shop-logo" />`
        : `<div class="shop-name">${siteName}</div>`;

      const itemRows = items.map((it: any) => `
        <tr>
          <td>${it.product_name}</td>
          <td style="text-align:center">${it.product_code || ''}</td>
          <td style="text-align:center">${it.quantity}</td>
          <td style="text-align:right">৳${it.total_price}</td>
        </tr>
      `).join('');

      const itemsTotal = items.reduce((s: number, it: any) => s + (it.total_price || 0), 0) || (order as any).product_cost || 0;

      return `
        <div class="memo">
          <div class="memo-header">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                ${logoHtml}
                <div class="order-date">Order Memo</div>
              </div>
              <div style="text-align:right;position:relative;z-index:1">
                <div class="order-num">#${order.order_number}</div>
                <div class="order-date">${format(new Date(order.created_at), "dd MMM yy • hh:mm a")}</div>
              </div>
            </div>
          </div>

          ${courier ? `
          <div class="courier-section">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="courier-badge">🚚 ${courier.provider_name}</span>
              ${courier.courier_status ? `<span class="courier-status">${courier.courier_status}</span>` : ''}
            </div>
            ${courier.tracking_id ? `
              <div class="tracking-box">
                <div class="tracking-label">Tracking ID</div>
                <div class="tracking-id">${courier.tracking_id}</div>
                <div class="barcode">*${courier.tracking_id}*</div>
              </div>
            ` : ''}
            ${courier.consignment_id ? `<div style="font-size:9px;margin-top:3px;color:#374151"><span style="font-weight:600">Consignment:</span> ${courier.consignment_id}</div>` : ''}
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">👤 Customer Info</div>
            <div class="info-grid">
              <span class="info-label">Name</span><span class="info-value">${order.customer_name}</span>
              <span class="info-label">Phone</span><span class="info-value phone-num">${order.customer_phone || '—'}</span>
              <span class="info-label">Address</span><span class="info-value">${order.customer_address || '—'}</span>
            </div>
          </div>

          ${items.length > 0 ? `
          <div class="section">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align:left">Product</th>
                  <th style="text-align:center">Code</th>
                  <th style="text-align:center">Qty</th>
                  <th style="text-align:right">Price</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
          ` : ''}

          <div class="totals-section">
            <div class="total-row"><span>Subtotal</span><span>৳${itemsTotal}</span></div>
            <div class="total-row"><span>Delivery</span><span>৳${order.delivery_charge}</span></div>
            ${Number(order.discount) > 0 ? `<div class="total-row discount"><span>Discount</span><span>-৳${order.discount}</span></div>` : ''}
            <div class="total-row grand-total"><span>Grand Total</span><span>৳${order.total_amount}</span></div>
          </div>

          ${(order as any).courier_note ? `<div class="courier-note"><strong>📝 Courier Note:</strong> ${(order as any).courier_note}</div>` : ''}
          ${order.notes ? `<div class="staff-note"><strong>📋 Staff Note:</strong> ${order.notes}</div>` : ''}

          <div class="memo-footer">
            <div class="thank-you">Thank you for your order! 🙏</div>
            <div>${format(new Date(), "dd/MM/yyyy")}</div>
          </div>
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("Could not open print window"); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Memo Print - ${orders.length} Orders</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>${BULK_STYLES}</style>
      </head>
      <body>
        ${(() => {
          const pages: string[] = [];
          for (let i = 0; i < memos.length; i += 3) {
            const pageMemos = memos.slice(i, i + 3);
            while (pageMemos.length < 3) pageMemos.push('<div></div>');
            pages.push(`<div class="page-container">${pageMemos.join('')}</div>`);
          }
          return pages.join('');
        })()}
      </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => {
        onPrinted(orderIds);
        printWindow.close();
      };
    }, 300);
  }, [orders, courierByOrderId, orderItemsByOrderId, siteName, siteLogo, onPrinted]);

  return { handleBulkPrint };
}