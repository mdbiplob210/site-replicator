import { AdminLayout } from "@/components/admin/AdminLayout";
import { useInvoices, Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { useCourierProviders } from "@/hooks/useCourier";
import { FileText, Printer, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useRef } from "react";

function InvoicePrint({ invoice, courierName }: { invoice: Invoice; courierName: string }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice - ${invoice.invoice_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', sans-serif; padding: 24px; font-size: 14px; color: #111; }
          .invoice { border: 2px solid #000; max-width: 500px; margin: auto; padding: 24px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
          .header h1 { font-size: 22px; margin-bottom: 4px; }
          .header .inv-no { font-size: 16px; font-weight: bold; color: #333; }
          .section { margin-bottom: 12px; }
          .section-title { font-weight: bold; font-size: 13px; color: #555; text-transform: uppercase; border-bottom: 1px solid #ddd; margin-bottom: 6px; padding-bottom: 3px; }
          .row { display: flex; justify-content: space-between; padding: 3px 0; }
          .label { font-weight: 600; }
          .divider { border-top: 2px dashed #999; margin: 12px 0; }
          .total-row { font-size: 18px; font-weight: bold; background: #f5f5f5; padding: 8px; border-radius: 4px; }
          .courier-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 12px; }
          .footer { text-align: center; font-size: 11px; color: #999; margin-top: 16px; padding-top: 8px; border-top: 1px solid #eee; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={handlePrint}>
        <Printer className="h-3.5 w-3.5 mr-1" /> প্রিন্ট
      </Button>
      <div ref={printRef} style={{ display: "none" }}>
        <div className="invoice">
          <div className="header">
            <h1>ইনভয়েস</h1>
            <div className="inv-no">{invoice.invoice_number}</div>
            {courierName && <div className="courier-badge">🚚 {courierName}</div>}
          </div>

          <div className="section">
            <div className="section-title">কাস্টমার তথ্য</div>
            <div className="row"><span className="label">নাম:</span><span>{invoice.customer_name}</span></div>
            <div className="row"><span className="label">ফোন:</span><span>{invoice.customer_phone || "—"}</span></div>
            <div className="row"><span className="label">ঠিকানা:</span><span>{invoice.customer_address || "—"}</span></div>
          </div>

          <div className="section">
            <div className="section-title">ডেলিভারি তথ্য</div>
            {invoice.courier_tracking_id && (
              <div className="row"><span className="label">ট্র্যাকিং:</span><span>{invoice.courier_tracking_id}</span></div>
            )}
            <div className="row">
              <span className="label">ডেলিভারি তারিখ:</span>
              <span>{invoice.delivery_date ? new Date(invoice.delivery_date).toLocaleDateString("bn-BD") : "—"}</span>
            </div>
          </div>

          <div className="divider" />

          <div className="section">
            <div className="section-title">পেমেন্ট ব্রেকডাউন</div>
            <div className="row"><span className="label">প্রোডাক্ট মূল্য:</span><span>৳{invoice.subtotal}</span></div>
            <div className="row"><span className="label">ডেলিভারি চার্জ:</span><span>৳{invoice.delivery_charge}</span></div>
            {Number(invoice.discount) > 0 && (
              <div className="row"><span className="label">ডিসকাউন্ট:</span><span>-৳{invoice.discount}</span></div>
            )}
          </div>

          <div className="divider" />

          <div className="total-row">
            <div className="row">
              <span>মোট:</span>
              <span>৳{invoice.total_amount}</span>
            </div>
          </div>
          <div className="row" style={{ marginTop: "6px" }}>
            <span className="label">COD সংগ্রহ:</span>
            <span style={{ fontWeight: "bold", color: "#2e7d32" }}>৳{invoice.cod_amount}</span>
          </div>

          <div className="footer">
            এই ইনভয়েসটি ডেলিভারি কনফার্ম হওয়ার পর অটোমেটিক্যালি তৈরি হয়েছে।<br/>
            তৈরির তারিখ: {new Date(invoice.created_at).toLocaleDateString("bn-BD")}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminInvoices() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: providers } = useCourierProviders();
  const [search, setSearch] = useState("");

  const providerMap = (providers || []).reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {} as Record<string, string>);

  const filtered = (invoices || []).filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    (inv.customer_phone || "").includes(search) ||
    (inv.courier_tracking_id || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ইনভয়েস</h1>
              <p className="text-sm text-muted-foreground">ডেলিভারি হওয়ার পর অটো জেনারেটেড ইনভয়েস</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">{filtered.length} টি ইনভয়েস</Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="ইনভয়েস নং, নাম, ফোন বা ট্র্যাকিং দিয়ে সার্চ করুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">কোনো ইনভয়েস নেই</p>
            <p className="text-sm mt-1">কুরিয়ার থেকে ডেলিভারি কনফার্ম হলে অটোমেটিক ইনভয়েস তৈরি হবে।</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ইনভয়েস নং</TableHead>
                  <TableHead>কাস্টমার</TableHead>
                  <TableHead>কুরিয়ার</TableHead>
                  <TableHead>ট্র্যাকিং</TableHead>
                  <TableHead className="text-right">মোট</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>তারিখ</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-bold text-xs">{inv.invoice_number}</TableCell>
                    <TableCell>
                      <div>{inv.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{inv.customer_phone}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {inv.courier_provider_id ? providerMap[inv.courier_provider_id] || "—" : "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{inv.courier_tracking_id || "—"}</TableCell>
                    <TableCell className="text-right font-bold">৳{inv.total_amount}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">৳{inv.cod_amount}</TableCell>
                    <TableCell className="text-xs">
                      {inv.delivery_date ? new Date(inv.delivery_date).toLocaleDateString("bn-BD") : "—"}
                    </TableCell>
                    <TableCell>
                      <InvoicePrint invoice={inv} courierName={inv.courier_provider_id ? providerMap[inv.courier_provider_id] || "" : ""} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
