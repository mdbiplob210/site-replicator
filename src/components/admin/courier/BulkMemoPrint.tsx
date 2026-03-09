import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  onPrinted: (orderIds: string[]) => void;
}

export function useBulkMemoPrint({ orders, courierByOrderId, orderItemsByOrderId, siteName = "SOHOZ", onPrinted }: BulkMemoPrintProps) {
  const handleBulkPrint = useCallback(async () => {
    if (orders.length === 0) return;

    // Fetch order items for orders that don't have items loaded yet
    const orderIds = orders.map(o => o.id);
    
    const memos = orders.map((order) => {
      const courier = courierByOrderId[order.id];
      const items = orderItemsByOrderId[order.id] || [];
      
      const itemRows = items.map((it: any) => `
        <tr>
          <td style="padding:3px 6px;border-bottom:1px solid #e5e7eb;font-size:11px">${it.product_name}</td>
          <td style="padding:3px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${it.product_code || ''}</td>
          <td style="padding:3px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center">${it.quantity}</td>
          <td style="padding:3px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">৳${it.total_price}</td>
        </tr>
      `).join('');

      return `
        <div class="memo">
          <!-- Header -->
          <div class="memo-header">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div class="shop-name">${siteName}</div>
                <div style="font-size:9px;color:#6b7280;margin-top:1px">Order Memo</div>
              </div>
              <div style="text-align:right">
                <div class="order-num">#${order.order_number}</div>
                <div style="font-size:9px;color:#6b7280">${format(new Date(order.created_at), "dd MMM yy • hh:mm a")}</div>
              </div>
            </div>
          </div>

          ${courier ? `
          <!-- Courier Info -->
          <div class="courier-section">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:6px">
                <span class="courier-badge">🚚 ${courier.provider_name}</span>
              </div>
              ${courier.courier_status ? `<span class="courier-status">${courier.courier_status}</span>` : ''}
            </div>
            ${courier.tracking_id ? `
              <div class="tracking-box">
                <div style="font-size:8px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Tracking ID</div>
                <div class="tracking-id">${courier.tracking_id}</div>
                <div class="barcode">*${courier.tracking_id}*</div>
              </div>
            ` : ''}
            ${courier.consignment_id ? `
              <div style="font-size:10px;margin-top:4px;color:#374151">
                <span style="font-weight:600">Consignment:</span> ${courier.consignment_id}
              </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Customer -->
          <div class="customer-section">
            <div class="section-title">👤 Customer Info</div>
            <div class="info-row"><span class="info-label">নাম</span><span class="info-value">${order.customer_name}</span></div>
            <div class="info-row"><span class="info-label">ফোন</span><span class="info-value phone-num">${order.customer_phone || '—'}</span></div>
            <div class="info-row"><span class="info-label">ঠিকানা</span><span class="info-value">${order.customer_address || '—'}</span></div>
          </div>

          <!-- Items -->
          ${items.length > 0 ? `
          <div class="items-section">
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align:left">পণ্য</th>
                  <th style="text-align:center">কোড</th>
                  <th style="text-align:center">পরি.</th>
                  <th style="text-align:right">মূল্য</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </div>
          ` : ''}

          <!-- Totals -->
          <div class="totals-section">
            <div class="total-row"><span>সাবটোটাল</span><span>৳${order.product_cost || 0}</span></div>
            <div class="total-row"><span>ডেলিভারি</span><span>৳${order.delivery_charge}</span></div>
            ${Number(order.discount) > 0 ? `<div class="total-row discount"><span>ডিসকাউন্ট</span><span>-৳${order.discount}</span></div>` : ''}
            <div class="total-row grand-total"><span>সর্বমোট</span><span>৳${order.total_amount}</span></div>
          </div>

          ${(order as any).courier_note ? `
          <div class="courier-note">
            <strong>📝 কুরিয়ার নোট:</strong> ${(order as any).courier_note}
          </div>
          ` : ''}

          ${order.notes ? `
          <div class="staff-note">
            <strong>📋 স্টাফ নোট:</strong> ${order.notes}
          </div>
          ` : ''}

          <div class="memo-footer">
            ধন্যবাদ আপনার অর্ডারের জন্য! • ${format(new Date(), "dd/MM/yyyy")}
          </div>
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) { toast.error("প্রিন্ট উইন্ডো খুলতে পারেনি"); return; }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Memo Print - ${orders.length} Orders</title>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', 'Noto Sans Bengali', sans-serif; font-size: 11px; color: #111827; }
          
          @page { size: A4; margin: 8mm; }
          
          .page-container {
            display: grid;
            grid-template-rows: repeat(3, 1fr);
            gap: 6mm;
            height: 100vh;
            page-break-after: always;
          }
          .page-container:last-child { page-break-after: auto; }
          
          .memo {
            border: 1.5px solid #1f2937;
            border-radius: 6px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          .memo-header {
            background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
            color: white;
            padding: 8px 12px;
          }
          .shop-name { font-size: 14px; font-weight: 800; letter-spacing: 1px; }
          .order-num { font-size: 16px; font-weight: 900; color: #fbbf24; }
          
          .courier-section {
            background: #f0fdf4;
            border-bottom: 1px solid #bbf7d0;
            padding: 6px 12px;
          }
          .courier-badge {
            background: #059669;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
          }
          .courier-status {
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            color: #059669;
            letter-spacing: 0.5px;
          }
          .tracking-box {
            background: white;
            border: 1px dashed #d1d5db;
            border-radius: 4px;
            padding: 6px 10px;
            text-align: center;
            margin-top: 6px;
          }
          .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #111827; }
          .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 36px; margin-top: 2px; line-height: 1; }
          
          .customer-section { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
          .section-title { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .info-row { display: flex; justify-content: space-between; padding: 1.5px 0; }
          .info-label { font-weight: 600; color: #6b7280; font-size: 10px; min-width: 45px; }
          .info-value { font-weight: 500; text-align: right; font-size: 11px; }
          .phone-num { font-family: monospace; font-weight: 700; color: #2563eb; font-size: 12px; }
          
          .items-section { padding: 4px 12px; border-bottom: 1px solid #e5e7eb; }
          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th { font-size: 9px; font-weight: 700; color: #6b7280; padding: 3px 6px; border-bottom: 1.5px solid #d1d5db; text-transform: uppercase; letter-spacing: 0.5px; }
          
          .totals-section { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
          .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
          .total-row.discount { color: #dc2626; }
          .total-row.grand-total { 
            font-size: 14px; font-weight: 900; 
            background: #f3f4f6; 
            margin: 4px -12px 0; padding: 6px 12px; 
            border-top: 1.5px solid #1f2937;
          }
          
          .courier-note { 
            background: #fef3c7; border: 1px solid #fbbf24; 
            padding: 4px 10px; margin: 4px 10px; border-radius: 4px; font-size: 10px; 
          }
          .staff-note { 
            padding: 4px 12px; font-size: 10px; color: #4b5563; 
          }
          
          .memo-footer { 
            text-align: center; font-size: 8px; color: #9ca3af; 
            padding: 4px 12px; border-top: 1px solid #f3f4f6; 
            margin-top: auto;
          }
          
          @media print { 
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${(() => {
          // Group memos into pages of 3
          const pages: string[] = [];
          for (let i = 0; i < memos.length; i += 3) {
            const pageMemos = memos.slice(i, i + 3);
            // Pad with empty divs if less than 3
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
  }, [orders, courierByOrderId, orderItemsByOrderId, siteName, onPrinted]);

  return { handleBulkPrint };
}
