import { format } from "date-fns";

interface MemoData {
  order: any;
  items: any[];
  courier?: { provider_name: string; tracking_id?: string; consignment_id?: string; courier_status?: string } | null;
  siteName: string;
  siteLogo?: string;
  itemsTotal: number;
}

// ─── POS RECEIPT STYLE (58mm/80mm thermal) ──────────────────────
export const POS_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; margin: auto; }
  @page { size: 80mm auto; margin: 2mm; }
  .receipt { padding: 4mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-bottom: 1px dashed #000; margin: 4px 0; }
  .double-sep { border-bottom: 2px solid #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; }
  .item-row { display: flex; justify-content: space-between; font-size: 11px; padding: 1px 0; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; padding: 2px 0; }
  .small { font-size: 10px; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 36px; text-align: center; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function generatePOSMemo(d: MemoData): string {
  const itemRows = d.items.map(it =>
    `<div class="item-row"><span>${it.product_name} x${it.quantity}</span><span>৳${it.total_price}</span></div>`
  ).join('');

  return `
    <div class="receipt">
      <div class="center bold" style="font-size:16px">${d.siteName}</div>
      <div class="sep"></div>
      <div class="center small">Order #${d.order.order_number}</div>
      <div class="center small">${format(new Date(d.order.created_at), "dd/MM/yyyy hh:mm a")}</div>
      <div class="sep"></div>
      <div class="small"><span class="bold">Customer:</span> ${d.order.customer_name}</div>
      <div class="small"><span class="bold">Phone:</span> ${d.order.customer_phone || '—'}</div>
      <div class="small"><span class="bold">Address:</span> ${d.order.customer_address || '—'}</div>
      ${d.courier ? `
        <div class="sep"></div>
        <div class="small"><span class="bold">Courier:</span> ${d.courier.provider_name}</div>
        ${d.courier.tracking_id ? `<div class="small"><span class="bold">Tracking:</span> ${d.courier.tracking_id}</div><div class="barcode">*${d.courier.tracking_id}*</div>` : ''}
      ` : ''}
      <div class="double-sep"></div>
      ${itemRows}
      <div class="sep"></div>
      <div class="row small"><span>Subtotal</span><span>৳${d.itemsTotal}</span></div>
      <div class="row small"><span>Delivery</span><span>৳${d.order.delivery_charge}</span></div>
      ${Number(d.order.discount) > 0 ? `<div class="row small"><span>Discount</span><span>-৳${d.order.discount}</span></div>` : ''}
      <div class="double-sep"></div>
      <div class="total-row"><span>TOTAL</span><span>৳${d.order.total_amount}</span></div>
      <div class="sep"></div>
      ${d.order.courier_note ? `<div class="small"><span class="bold">Note:</span> ${d.order.courier_note}</div><div class="sep"></div>` : ''}
      <div class="center small" style="margin-top:4px">Thank you! 🙏</div>
      <div class="center small">${format(new Date(), "dd/MM/yyyy")}</div>
    </div>
  `;
}

// ─── TEMPLATE STYLES ──────────────────────────────────────────
const COMMON_BASE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'Noto Sans Bengali', sans-serif; font-size: 14px; line-height: 1.2; color: #1a1a2e; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 30px; line-height: 0.95; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { font-size: 10px; font-weight: 700; padding: 3px 6px; text-transform: uppercase; letter-spacing: 0.45px; }
  .items-table td { padding: 3px 6px; font-size: 13px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

// Template 1: Premium Dark (existing improved)
const STYLE_1 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1.5px solid #e2e8f0; }
  .memo-header { background: #ffffff; color: #1a1a2e; padding: 10px 14px; position: relative; overflow: hidden; border-bottom: 2px solid #e2e8f0; }
  .memo-header::after { content: ''; position: absolute; top: -30px; right: -30px; width: 60px; height: 60px; border-radius: 50%; background: rgba(37,99,235,0.08); }
  .shop-name { font-size: 16px; font-weight: 800; letter-spacing: 1px; color: #1a1a2e; }
  .shop-logo { height: 26px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #2563eb; }
  .order-date { font-size: 11px; color: #64748b; }
  .courier-section { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-bottom: 1px solid #bbf7d0; padding: 6px 14px; }
  .courier-badge { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .courier-status { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #059669; background: #d1fae5; padding: 1px 6px; border-radius: 10px; }
  .tracking-box { background: #fff; border: 1.5px dashed #a7f3d0; border-radius: 6px; padding: 4px 10px; text-align: center; margin-top: 4px; }
  .tracking-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 15px; font-weight: 900; letter-spacing: 2px; color: #0f172a; }
  .section { padding: 6px 14px; border-bottom: 1px solid #f1f5f9; }
  .section-title { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .info-grid { display: grid; grid-template-columns: 65px 1fr; gap: 2px 6px; }
  .info-label { font-size: 12px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 14px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #2563eb; font-size: 14px; }
  .items-table th { color: #94a3b8; border-bottom: 2px solid #e2e8f0; background: #f8fafc; }
  .items-table td { border-bottom: 1px solid #f1f5f9; }
  .totals-section { padding: 4px 14px; background: #fafbfc; }
  .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 14px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 16px; font-weight: 900; color: #0f172a; margin-top: 2px; padding-top: 3px; border-top: 2px solid #1e293b; }
  .courier-note { background: linear-gradient(135deg, #fef3c7, #fffbeb); border-left: 3px solid #f59e0b; padding: 4px 10px; margin: 4px 10px; border-radius: 0 4px 4px 0; font-size: 12px; color: #92400e; }
  .staff-note { padding: 3px 14px; font-size: 12px; color: #64748b; background: #f8fafc; }
  .memo-footer { text-align: center; padding: 5px 14px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafbfc; margin-top: auto; flex-shrink: 0; }
  .memo-footer .thank-you { font-weight: 700; color: #64748b; font-size: 11px; }
`;

// Template 2: Clean Professional (blue)
const STYLE_2 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 6px; overflow: hidden; border: 2px solid #dbeafe; min-height: 0; }
  .memo-header { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; padding: 5px 8px; }
  .shop-name { font-size: 11px; font-weight: 800; }
  .shop-logo { height: 16px; width: auto; }
  .order-num { font-size: 13px; font-weight: 900; color: #bfdbfe; }
  .order-date { font-size: 7px; color: #93c5fd; }
  .courier-section { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 4px 8px; }
  .courier-badge { background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-size: 7px; font-weight: 700; }
  .courier-status { font-size: 6px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; background: #dbeafe; padding: 1px 4px; border-radius: 4px; }
  .tracking-box { background: #fff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 2px 6px; text-align: center; margin-top: 2px; }
  .tracking-label { font-size: 6px; color: #6b7280; text-transform: uppercase; letter-spacing: 1.6px; }
  .tracking-id { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #1e3a5f; }
  .section { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; }
  .section-title { font-size: 6px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.4px; margin-bottom: 2px; }
  .info-grid { display: grid; grid-template-columns: 46px 1fr; gap: 1px 5px; }
  .info-label { font-size: 7px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 8px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #1d4ed8; font-size: 8px; }
  .items-table th { color: #2563eb; border-bottom: 1px solid #dbeafe; background: #eff6ff; }
  .items-table td { border-bottom: 1px solid #f1f5f9; }
  .totals-section { padding: 2px 8px; background: #f8fafc; }
  .total-row { display: flex; justify-content: space-between; padding: 0; font-size: 8px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 10px; font-weight: 900; color: #1d4ed8; margin-top: 1px; padding-top: 2px; border-top: 2px solid #2563eb; }
  .courier-note { background: #fef3c7; border-left: 2px solid #f59e0b; padding: 2px 6px; margin: 2px 6px; border-radius: 0 3px 3px 0; font-size: 7px; color: #92400e; }
  .staff-note { padding: 2px 8px; font-size: 7px; color: #64748b; background: #f8fafc; }
  .memo-footer { text-align: center; padding: 3px 8px; font-size: 6px; color: #94a3b8; border-top: 1px solid #dbeafe; background: #eff6ff; margin-top: auto; flex-shrink: 0; }
  .memo-footer .thank-you { font-weight: 700; color: #2563eb; font-size: 7px; }
`;

// Template 3: Modern Gradient (purple/pink)
const STYLE_3 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; border: 1.5px solid #e9d5ff; }
  .memo-header { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; padding: 8px 12px; }
  .shop-name { font-size: 13px; font-weight: 800; }
  .shop-logo { height: 22px; width: auto; }
  .order-num { font-size: 15px; font-weight: 900; color: #fde68a; }
  .order-date { font-size: 9px; color: #f0abfc; }
  .courier-section { background: linear-gradient(135deg, #faf5ff, #fdf2f8); border-bottom: 1px solid #e9d5ff; padding: 6px 12px; }
  .courier-badge { background: linear-gradient(135deg, #7c3aed, #db2777); color: white; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 700; }
  .courier-status { font-size: 8px; font-weight: 700; color: #7c3aed; background: #ede9fe; padding: 1px 6px; border-radius: 10px; }
  .tracking-box { background: #fff; border: 1.5px dashed #d8b4fe; border-radius: 8px; padding: 4px 10px; text-align: center; margin-top: 4px; }
  .tracking-label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #581c87; }
  .section { padding: 6px 12px; border-bottom: 1px solid #faf5ff; }
  .section-title { font-size: 8px; font-weight: 700; color: #a855f7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .info-grid { display: grid; grid-template-columns: 55px 1fr; gap: 2px 6px; }
  .info-label { font-size: 9px; font-weight: 600; color: #7c3aed; }
  .info-value { font-size: 10px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #7c3aed; font-size: 10px; }
  .items-table th { color: #a855f7; border-bottom: 2px solid #e9d5ff; background: #faf5ff; }
  .items-table td { border-bottom: 1px solid #faf5ff; }
  .totals-section { padding: 4px 12px; background: #faf5ff; }
  .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 13px; font-weight: 900; color: #7c3aed; margin-top: 2px; padding-top: 3px; border-top: 2px solid #7c3aed; }
  .courier-note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 4px 10px; margin: 4px 10px; border-radius: 0 4px 4px 0; font-size: 9px; color: #92400e; }
  .staff-note { padding: 3px 12px; font-size: 9px; color: #64748b; background: #faf5ff; }
  .memo-footer { text-align: center; padding: 5px 12px; font-size: 8px; color: #a855f7; border-top: 1px solid #e9d5ff; background: #faf5ff; }
  .memo-footer .thank-you { font-weight: 700; color: #7c3aed; font-size: 9px; }
`;

// Template 4: Eco Minimal (green)
const STYLE_4 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1.5px solid #bbf7d0; }
  .memo-header { background: linear-gradient(135deg, #059669, #047857); color: #fff; padding: 8px 12px; }
  .shop-name { font-size: 13px; font-weight: 800; }
  .shop-logo { height: 22px; width: auto; }
  .order-num { font-size: 15px; font-weight: 900; color: #a7f3d0; }
  .order-date { font-size: 9px; color: #6ee7b7; }
  .courier-section { background: #ecfdf5; border-bottom: 1px solid #bbf7d0; padding: 6px 12px; }
  .courier-badge { background: #047857; color: white; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 700; }
  .courier-status { font-size: 8px; font-weight: 700; color: #047857; background: #d1fae5; padding: 1px 6px; border-radius: 6px; }
  .tracking-box { background: #fff; border: 1px solid #bbf7d0; border-radius: 4px; padding: 4px 10px; text-align: center; margin-top: 4px; }
  .tracking-label { font-size: 7px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #064e3b; }
  .section { padding: 6px 12px; border-bottom: 1px solid #f0fdf4; }
  .section-title { font-size: 8px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 3px; }
  .info-grid { display: grid; grid-template-columns: 55px 1fr; gap: 2px 6px; }
  .info-label { font-size: 9px; font-weight: 600; color: #047857; }
  .info-value { font-size: 10px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #059669; font-size: 10px; }
  .items-table th { color: #059669; border-bottom: 2px solid #bbf7d0; background: #ecfdf5; }
  .items-table td { border-bottom: 1px solid #f0fdf4; }
  .totals-section { padding: 4px 12px; background: #f0fdf4; }
  .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 13px; font-weight: 900; color: #047857; margin-top: 2px; padding-top: 3px; border-top: 2px solid #059669; }
  .courier-note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 4px 10px; margin: 4px 10px; border-radius: 0 4px 4px 0; font-size: 9px; color: #92400e; }
  .staff-note { padding: 3px 12px; font-size: 9px; color: #64748b; background: #f0fdf4; }
  .memo-footer { text-align: center; padding: 5px 12px; font-size: 8px; color: #059669; border-top: 1px solid #bbf7d0; background: #ecfdf5; }
  .memo-footer .thank-you { font-weight: 700; color: #047857; font-size: 9px; }
`;

// Template 5: Bold Corporate (black/red)
const STYLE_5 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 4px; overflow: hidden; border: 2px solid #1a1a1a; }
  .memo-header { background: #0a0a0a; color: #fff; padding: 8px 12px; }
  .shop-name { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
  .shop-logo { height: 22px; width: auto; }
  .order-num { font-size: 15px; font-weight: 900; color: #ef4444; }
  .order-date { font-size: 9px; color: #737373; }
  .courier-section { background: #fafafa; border-bottom: 2px solid #e5e5e5; padding: 6px 12px; }
  .courier-badge { background: #ef4444; color: white; padding: 2px 8px; border-radius: 2px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .courier-status { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #0a0a0a; background: #e5e5e5; padding: 1px 6px; border-radius: 2px; }
  .tracking-box { background: #fff; border: 2px solid #e5e5e5; border-radius: 4px; padding: 4px 10px; text-align: center; margin-top: 4px; }
  .tracking-label { font-size: 7px; color: #737373; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 13px; font-weight: 900; letter-spacing: 2px; color: #0a0a0a; }
  .section { padding: 6px 12px; border-bottom: 1px solid #f5f5f5; }
  .section-title { font-size: 8px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 3px; }
  .info-grid { display: grid; grid-template-columns: 55px 1fr; gap: 2px 6px; }
  .info-label { font-size: 9px; font-weight: 700; color: #525252; text-transform: uppercase; }
  .info-value { font-size: 10px; font-weight: 500; color: #0a0a0a; }
  .phone-num { font-family: monospace; font-weight: 900; color: #0a0a0a; font-size: 10px; }
  .items-table th { color: #737373; border-bottom: 2px solid #0a0a0a; background: #fafafa; text-transform: uppercase; }
  .items-table td { border-bottom: 1px solid #f5f5f5; }
  .totals-section { padding: 4px 12px; background: #fafafa; }
  .total-row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 10px; color: #525252; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 13px; font-weight: 900; color: #0a0a0a; margin-top: 2px; padding-top: 3px; border-top: 3px solid #0a0a0a; }
  .courier-note { background: #fef3c7; border-left: 3px solid #f59e0b; padding: 4px 10px; margin: 4px 10px; font-size: 9px; color: #92400e; }
  .staff-note { padding: 3px 12px; font-size: 9px; color: #525252; background: #fafafa; }
  .memo-footer { text-align: center; padding: 5px 12px; font-size: 8px; color: #737373; border-top: 2px solid #0a0a0a; background: #fafafa; }
  .memo-footer .thank-you { font-weight: 900; color: #0a0a0a; font-size: 9px; text-transform: uppercase; }
`;

export const TEMPLATE_STYLES: Record<string, string> = {
  "1": STYLE_1,
  "2": STYLE_2,
  "3": STYLE_3,
  "4": STYLE_4,
  "5": STYLE_5,
  "6": POS_STYLES,
};

// Standard A4/single memo HTML generator (shared across templates 1-5)
export function generateStandardMemo(d: MemoData): string {
  const logoHtml = d.siteLogo
    ? `<img src="${d.siteLogo}" alt="${d.siteName}" class="shop-logo" />`
    : `<div class="shop-name">${d.siteName}</div>`;

  const itemRows = d.items.map((it, index) => {
    const fallbackPrice = d.items.length === 1
      ? Number(it.total_price ?? it.unit_price ?? d.order.product_cost ?? (Number(d.order.total_amount || 0) - Number(d.order.delivery_charge || 0) + Number(d.order.discount || 0)))
      : Number(it.total_price ?? it.unit_price ?? 0);
    const fallbackQty = Number(it.quantity ?? 1);

    return `
      <tr>
        <td>${it.product_name || `Item ${index + 1}`}</td>
        <td style="text-align:center">${it.product_code || ''}</td>
        <td style="text-align:center">${fallbackQty}</td>
        <td style="text-align:right">৳${fallbackPrice}</td>
      </tr>
    `;
  }).join('');

  return `
    <div class="memo">
      <div class="memo-header">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            ${logoHtml}
            <div class="order-date">Order Memo</div>
          </div>
          <div style="text-align:right;position:relative;z-index:1">
            <div class="order-num">#${d.order.order_number}</div>
            <div class="order-date">${format(new Date(d.order.created_at), "dd MMM yy • hh:mm a")}</div>
          </div>
        </div>
      </div>

      ${d.courier ? `
      <div class="courier-section">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="courier-badge">🚚 ${d.courier.provider_name}</span>
          ${d.courier.courier_status ? `<span class="courier-status">${d.courier.courier_status}</span>` : ''}
        </div>
        ${d.courier.tracking_id ? `
          <div class="tracking-box">
            <div class="tracking-label">Tracking ID</div>
            <div class="tracking-id">${d.courier.tracking_id}</div>
            <div class="barcode">*${d.courier.tracking_id}*</div>
          </div>
        ` : ''}
        ${d.courier.consignment_id ? `<div style="font-size:10px;margin-top:4px;color:#374151"><span style="font-weight:600">Consignment:</span> ${d.courier.consignment_id}</div>` : ''}
      </div>
      ` : ''}

      <div class="section">
        <div class="section-title">👤 Customer Info</div>
        <div class="info-grid">
          <span class="info-label">Name</span><span class="info-value">${d.order.customer_name}</span>
          <span class="info-label">Phone</span><span class="info-value phone-num">${d.order.customer_phone || '—'}</span>
          <span class="info-label">Address</span><span class="info-value">${d.order.customer_address || '—'}</span>
        </div>
      </div>

      ${d.items.length > 0 ? `
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
        <div class="total-row"><span>Subtotal</span><span>৳${d.itemsTotal}</span></div>
        <div class="total-row"><span>Delivery</span><span>৳${d.order.delivery_charge}</span></div>
        ${Number(d.order.discount) > 0 ? `<div class="total-row discount"><span>Discount</span><span>-৳${d.order.discount}</span></div>` : ''}
        <div class="total-row grand-total"><span>Grand Total</span><span>৳${d.order.total_amount}</span></div>
      </div>

      ${d.order.courier_note ? `<div class="courier-note"><strong>📝 Courier Note:</strong> ${d.order.courier_note}</div>` : ''}
      ${d.order.notes ? `<div class="staff-note"><strong>📋 Staff Note:</strong> ${d.order.notes}</div>` : ''}

      <div class="memo-footer">
        <div class="thank-you">Thank you for your order! 🙏</div>
        <div>${format(new Date(), "dd/MM/yyyy")}</div>
      </div>
    </div>
  `;
}

export function getTemplateStyle(templateId: string): string {
  return TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES["1"];
}

export function generateMemoHtml(templateId: string, data: MemoData): string {
  if (templateId === "6") {
    return generatePOSMemo(data);
  }
  return generateStandardMemo(data);
}
