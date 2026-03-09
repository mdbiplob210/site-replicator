import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { Order } from "@/hooks/useOrders";
import type { CourierOrder, CourierProvider } from "@/hooks/useCourier";

interface MemoPrintProps {
  order: Order;
  courierOrder?: CourierOrder | null;
  courierProvider?: CourierProvider | null;
  orderItems?: any[];
}

export function MemoPrint({ order, courierOrder, courierProvider, orderItems }: MemoPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>মেমো - ${order.order_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; font-size: 14px; }
          .memo { border: 2px solid #000; padding: 20px; max-width: 400px; margin: auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .courier-badge { background: #f0f0f0; padding: 6px 12px; border-radius: 4px; display: inline-block; margin: 6px 0; font-weight: bold; }
          .tracking { font-size: 18px; font-weight: bold; text-align: center; padding: 8px; background: #f8f8f8; border: 1px dashed #999; margin: 8px 0; letter-spacing: 2px; }
          .barcode { text-align: center; font-family: 'Libre Barcode 39', monospace; font-size: 48px; margin: 10px 0; }
          .row { display: flex; justify-content: space-between; padding: 3px 0; }
          .label { font-weight: bold; }
          .divider { border-top: 1px dashed #999; margin: 8px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 16px; }
          @media print { body { padding: 0; } }
        </style>
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

  return (
    <>
      <Button size="sm" variant="outline" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-1" /> মেমো প্রিন্ট
      </Button>

      <div ref={printRef} style={{ display: "none" }}>
        <div className="memo">
          <div className="header">
            {courierProvider && (
              <div className="courier-badge">🚚 {courierProvider.name}</div>
            )}
            <h2 style={{ marginTop: 6 }}>অর্ডার মেমো</h2>
            <div style={{ fontSize: 12, color: "#666" }}>
              {new Date(order.created_at).toLocaleDateString("bn-BD")}
            </div>
          </div>

          {courierOrder?.tracking_id && (
            <>
              <div className="tracking">{courierOrder.tracking_id}</div>
              <div className="barcode">*{courierOrder.tracking_id}*</div>
            </>
          )}

          {courierOrder?.consignment_id && (
            <div className="row">
              <span className="label">Consignment ID:</span>
              <span>{courierOrder.consignment_id}</span>
            </div>
          )}

          <div className="divider" />

          <div className="row">
            <span className="label">অর্ডার নং:</span>
            <span>{order.order_number}</span>
          </div>
          <div className="row">
            <span className="label">নাম:</span>
            <span>{order.customer_name}</span>
          </div>
          <div className="row">
            <span className="label">ফোন:</span>
            <span>{order.customer_phone || "—"}</span>
          </div>
          <div className="row">
            <span className="label">ঠিকানা:</span>
            <span>{order.customer_address || "—"}</span>
          </div>

          <div className="divider" />

          {orderItems && orderItems.length > 0 && (
            <table className="items-table">
              <thead>
                <tr>
                  <th>পণ্য</th>
                  <th>কোড</th>
                  <th>পরি.</th>
                  <th>মূল্য</th>
                </tr>
              </thead>
              <tbody>
                {orderItems.map((item: any, i: number) => (
                  <tr key={i}>
                    <td>{item.product_name}</td>
                    <td>{item.product_code}</td>
                    <td>{item.quantity}</td>
                    <td>৳{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="divider" />

          <div className="row">
            <span className="label">ডেলিভারি চার্জ:</span>
            <span>৳{order.delivery_charge}</span>
          </div>
          <div className="row">
            <span className="label">ডিসকাউন্ট:</span>
            <span>৳{order.discount}</span>
          </div>
          <div className="row total-row">
            <span>মোট:</span>
            <span>৳{order.total_amount}</span>
          </div>

          {courierOrder && (
            <>
              <div className="divider" />
              <div className="row">
                <span className="label">কুরিয়ার স্ট্যাটাস:</span>
                <span>{courierOrder.courier_status}</span>
              </div>
            </>
          )}

          {(order as any).courier_note && (
            <>
              <div className="divider" />
              <div style={{ background: '#fff3cd', padding: '6px 8px', borderRadius: '4px', border: '1px solid #ffc107' }}>
                <span className="label">কুরিয়ার নোট: </span>
                <span>{(order as any).courier_note}</span>
              </div>
            </>
          )}

          {order.notes && (
            <>
              <div className="divider" />
              <div>
                <span className="label">স্টাফ নোট: </span>
                <span>{order.notes}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
