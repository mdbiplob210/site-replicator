import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import type { Order } from "@/hooks/useOrders";
import type { CourierOrder, CourierProvider } from "@/hooks/useCourier";

interface MemoPrintProps {
  order: Order;
  courierOrder?: CourierOrder | null;
  courierProvider?: CourierProvider | null;
  orderItems?: any[];
}

const MEMO_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Noto Sans Bengali', sans-serif; padding: 16px; font-size: 12px; color: #1a1a2e; background: #f8f9fa; }

  .memo {
    max-width: 380px; margin: auto; background: #fff;
    border-radius: 12px; overflow: hidden;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
    border: 1px solid #e2e8f0;
  }

  .memo-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
    color: #fff; padding: 16px 18px;
    position: relative; overflow: hidden;
  }
  .memo-header::after {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(251,191,36,0.15);
  }
  .shop-name { font-size: 18px; font-weight: 800; letter-spacing: 1.5px; }
  .shop-logo { height: 32px; width: auto; object-fit: contain; }
  .order-num { font-size: 20px; font-weight: 900; color: #fbbf24; }
  .order-date { font-size: 10px; color: #94a3b8; margin-top: 2px; }

  .courier-section {
    background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
    border-bottom: 1px solid #bbf7d0;
    padding: 10px 18px;
  }
  .courier-badge {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white; padding: 3px 10px; border-radius: 20px;
    font-size: 10px; font-weight: 700; display: inline-block;
  }
  .courier-status {
    font-size: 9px; font-weight: 700; text-transform: uppercase;
    color: #059669; letter-spacing: 1px;
    background: #d1fae5; padding: 2px 8px; border-radius: 10px;
  }
  .tracking-box {
    background: #fff; border: 1.5px dashed #a7f3d0; border-radius: 8px;
    padding: 10px 14px; text-align: center; margin-top: 8px;
  }
  .tracking-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 18px; font-weight: 900; letter-spacing: 4px; color: #0f172a; margin: 4px 0; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 44px; line-height: 1; color: #1a1a2e; }

  .section { padding: 10px 18px; border-bottom: 1px solid #f1f5f9; }
  .section-title {
    font-size: 9px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;
    display: flex; align-items: center; gap: 4px;
  }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 4px 8px; }
  .info-label { font-size: 10px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: 'SF Mono', monospace; font-weight: 700; color: #2563eb; font-size: 13px; letter-spacing: 0.5px; }

  .items-table { width: 100%; border-collapse: separate; border-spacing: 0; }
  .items-table th {
    font-size: 9px; font-weight: 700; color: #94a3b8; padding: 5px 8px;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 2px solid #e2e8f0; background: #f8fafc;
  }
  .items-table td {
    padding: 5px 8px; font-size: 11px; border-bottom: 1px solid #f1f5f9;
  }
  .items-table tr:last-child td { border-bottom: none; }

  .totals-section { padding: 8px 18px 10px; background: #fafbfc; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total {
    font-size: 16px; font-weight: 900; color: #0f172a;
    margin-top: 6px; padding-top: 8px;
    border-top: 2px solid #1e293b;
  }

  .courier-note {
    background: linear-gradient(135deg, #fef3c7, #fffbeb);
    border-left: 4px solid #f59e0b;
    padding: 8px 14px; margin: 8px 14px; border-radius: 0 6px 6px 0;
    font-size: 11px; color: #92400e;
  }
  .staff-note {
    padding: 6px 18px; font-size: 10px; color: #64748b;
    background: #f8fafc;
  }

  .memo-footer {
    text-align: center; padding: 10px 18px;
    font-size: 9px; color: #94a3b8;
    border-top: 1px solid #f1f5f9;
    background: #fafbfc;
  }
  .memo-footer .thank-you { font-weight: 700; color: #64748b; font-size: 10px; }

  @media print {
    body { padding: 0; background: #fff; }
    .memo { box-shadow: none; border: 1.5px solid #1e293b; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function MemoPrint({ order, courierOrder, courierProvider, orderItems }: MemoPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSiteSettings();
  const siteName = settings?.site_name || "STORE";
  const siteLogo = settings?.site_logo || "";

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>মেমো - ${order.order_number}</title>
        <style>${MEMO_STYLES}</style>
        <link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" rel="stylesheet">
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    }, 300);
  };

  const itemsTotal = orderItems?.reduce((sum: number, it: any) => sum + (it.total_price || 0), 0) || order.product_cost || 0;

  return (
    <>
      <Button size="sm" variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-1" /> মেমো প্রিন্ট
      </Button>

      <div ref={printRef} style={{ display: "none" }}>
        <div className="memo">
          {/* Header */}
          <div className="memo-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {siteLogo
                  ? <img src={siteLogo} alt={siteName} className="shop-logo" />
                  : <div className="shop-name">{siteName}</div>
                }
                <div className="order-date">Order Memo</div>
              </div>
              <div style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
                <div className="order-num">#{order.order_number}</div>
                <div className="order-date">{format(new Date(order.created_at), "dd MMM yyyy • hh:mm a")}</div>
              </div>
            </div>
          </div>

          {/* Courier */}
          {courierProvider && (
            <div className="courier-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="courier-badge">🚚 {courierProvider.name}</span>
                {courierOrder?.courier_status && <span className="courier-status">{courierOrder.courier_status}</span>}
              </div>
              {courierOrder?.tracking_id && (
                <div className="tracking-box">
                  <div className="tracking-label">Tracking ID</div>
                  <div className="tracking-id">{courierOrder.tracking_id}</div>
                  <div className="barcode">*{courierOrder.tracking_id}*</div>
                </div>
              )}
              {courierOrder?.consignment_id && (
                <div style={{ fontSize: 10, marginTop: 6, color: "#374151" }}>
                  <span style={{ fontWeight: 600 }}>Consignment:</span> {courierOrder.consignment_id}
                </div>
              )}
            </div>
          )}

          {/* Customer */}
          <div className="section">
            <div className="section-title">👤 কাস্টমার তথ্য</div>
            <div className="info-grid">
              <span className="info-label">নাম</span>
              <span className="info-value">{order.customer_name}</span>
              <span className="info-label">ফোন</span>
              <span className="info-value phone-num">{order.customer_phone || "—"}</span>
              <span className="info-label">ঠিকানা</span>
              <span className="info-value">{order.customer_address || "—"}</span>
            </div>
          </div>

          {/* Items */}
          {orderItems && orderItems.length > 0 && (
            <div className="section">
              <div className="section-title">📦 পণ্যের বিবরণ</div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>পণ্য</th>
                    <th style={{ textAlign: "center" }}>কোড</th>
                    <th style={{ textAlign: "center" }}>পরি.</th>
                    <th style={{ textAlign: "right" }}>মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{item.product_name}</td>
                      <td style={{ textAlign: "center" }}>{item.product_code}</td>
                      <td style={{ textAlign: "center" }}>{item.quantity}</td>
                      <td style={{ textAlign: "right" }}>৳{item.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="totals-section">
            <div className="total-row"><span>সাবটোটাল</span><span>৳{itemsTotal}</span></div>
            <div className="total-row"><span>ডেলিভারি চার্জ</span><span>৳{order.delivery_charge}</span></div>
            {Number(order.discount) > 0 && (
              <div className="total-row discount"><span>ডিসকাউন্ট</span><span>-৳{order.discount}</span></div>
            )}
            <div className="total-row grand-total"><span>সর্বমোট</span><span>৳{order.total_amount}</span></div>
          </div>

          {/* Notes */}
          {(order as any).courier_note && (
            <div className="courier-note">
              <strong>📝 কুরিয়ার নোট:</strong> {(order as any).courier_note}
            </div>
          )}
          {order.notes && (
            <div className="staff-note">
              <strong>📋 স্টাফ নোট:</strong> {order.notes}
            </div>
          )}

          {/* Footer */}
          <div className="memo-footer">
            <div className="thank-you">ধন্যবাদ আপনার অর্ডারের জন্য! 🙏</div>
            <div style={{ marginTop: 3 }}>Printed on {format(new Date(), "dd/MM/yyyy")}</div>
          </div>
        </div>
      </div>
    </>
  );
}
