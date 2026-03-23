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
  body { font-family: 'Segoe UI', 'Noto Sans Bengali', sans-serif; font-size: 11px; color: #1a1a2e; }
  .barcode { font-family: 'Libre Barcode 39', monospace; font-size: 32px; line-height: 1; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { font-size: 8px; font-weight: 700; padding: 3px 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .items-table td { padding: 3px 6px; font-size: 10px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

// Template 1: Premium Dark (existing improved)
const STYLE_1 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1.5px solid #e2e8f0; }
  .memo-header { background: linear-gradient(135deg, #0f172a, #1e293b, #334155); color: #fff; padding: 16px 18px; position: relative; overflow: hidden; }
  .memo-header::after { content: ''; position: absolute; top: -30px; right: -30px; width: 80px; height: 80px; border-radius: 50%; background: rgba(251,191,36,0.15); }
  .shop-name { font-size: 16px; font-weight: 800; letter-spacing: 1.5px; }
  .shop-logo { height: 30px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #fbbf24; }
  .order-date { font-size: 10px; color: #94a3b8; }
  .courier-section { background: linear-gradient(135deg, #ecfdf5, #f0fdf4); border-bottom: 1px solid #bbf7d0; padding: 10px 18px; }
  .courier-badge { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .courier-status { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #059669; background: #d1fae5; padding: 2px 8px; border-radius: 10px; }
  .tracking-box { background: #fff; border: 1.5px dashed #a7f3d0; border-radius: 8px; padding: 8px 14px; text-align: center; margin-top: 8px; }
  .tracking-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #0f172a; }
  .section { padding: 10px 18px; border-bottom: 1px solid #f1f5f9; }
  .section-title { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 3px 8px; }
  .info-label { font-size: 10px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #2563eb; font-size: 12px; }
  .items-table th { color: #94a3b8; border-bottom: 2px solid #e2e8f0; background: #f8fafc; }
  .items-table td { border-bottom: 1px solid #f1f5f9; }
  .totals-section { padding: 8px 18px; background: #fafbfc; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 15px; font-weight: 900; color: #0f172a; margin-top: 4px; padding-top: 6px; border-top: 2px solid #1e293b; }
  .courier-note { background: linear-gradient(135deg, #fef3c7, #fffbeb); border-left: 4px solid #f59e0b; padding: 8px 14px; margin: 6px 14px; border-radius: 0 6px 6px 0; font-size: 11px; color: #92400e; }
  .staff-note { padding: 6px 18px; font-size: 10px; color: #64748b; background: #f8fafc; }
  .memo-footer { text-align: center; padding: 10px 18px; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafbfc; }
  .memo-footer .thank-you { font-weight: 700; color: #64748b; font-size: 10px; }
`;

// Template 2: Clean Professional (blue)
const STYLE_2 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; border: 2px solid #dbeafe; }
  .memo-header { background: linear-gradient(135deg, #1d4ed8, #2563eb); color: #fff; padding: 16px 18px; }
  .shop-name { font-size: 16px; font-weight: 800; }
  .shop-logo { height: 30px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #bfdbfe; }
  .order-date { font-size: 10px; color: #93c5fd; }
  .courier-section { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 10px 18px; }
  .courier-badge { background: #2563eb; color: white; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; }
  .courier-status { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #1d4ed8; background: #dbeafe; padding: 2px 8px; border-radius: 4px; }
  .tracking-box { background: #fff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 14px; text-align: center; margin-top: 8px; }
  .tracking-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #1e3a5f; }
  .section { padding: 10px 18px; border-bottom: 1px solid #f1f5f9; }
  .section-title { font-size: 9px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 3px 8px; }
  .info-label { font-size: 10px; font-weight: 600; color: #64748b; }
  .info-value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #1d4ed8; font-size: 12px; }
  .items-table th { color: #2563eb; border-bottom: 2px solid #dbeafe; background: #eff6ff; }
  .items-table td { border-bottom: 1px solid #f1f5f9; }
  .totals-section { padding: 8px 18px; background: #f8fafc; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 15px; font-weight: 900; color: #1d4ed8; margin-top: 4px; padding-top: 6px; border-top: 2px solid #2563eb; }
  .courier-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 14px; margin: 6px 14px; border-radius: 0 6px 6px 0; font-size: 11px; color: #92400e; }
  .staff-note { padding: 6px 18px; font-size: 10px; color: #64748b; background: #f8fafc; }
  .memo-footer { text-align: center; padding: 10px 18px; font-size: 9px; color: #94a3b8; border-top: 2px solid #dbeafe; background: #eff6ff; }
  .memo-footer .thank-you { font-weight: 700; color: #2563eb; font-size: 10px; }
`;

// Template 3: Modern Gradient (purple/pink)
const STYLE_3 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1.5px solid #e9d5ff; }
  .memo-header { background: linear-gradient(135deg, #7c3aed, #db2777); color: #fff; padding: 18px 20px; }
  .shop-name { font-size: 16px; font-weight: 800; }
  .shop-logo { height: 30px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #fde68a; }
  .order-date { font-size: 10px; color: #f0abfc; }
  .courier-section { background: linear-gradient(135deg, #faf5ff, #fdf2f8); border-bottom: 1px solid #e9d5ff; padding: 10px 18px; }
  .courier-badge { background: linear-gradient(135deg, #7c3aed, #db2777); color: white; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; }
  .courier-status { font-size: 9px; font-weight: 700; color: #7c3aed; background: #ede9fe; padding: 2px 8px; border-radius: 10px; }
  .tracking-box { background: #fff; border: 1.5px dashed #d8b4fe; border-radius: 12px; padding: 8px 14px; text-align: center; margin-top: 8px; }
  .tracking-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #581c87; }
  .section { padding: 10px 18px; border-bottom: 1px solid #faf5ff; }
  .section-title { font-size: 9px; font-weight: 700; color: #a855f7; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 3px 8px; }
  .info-label { font-size: 10px; font-weight: 600; color: #7c3aed; }
  .info-value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #7c3aed; font-size: 12px; }
  .items-table th { color: #a855f7; border-bottom: 2px solid #e9d5ff; background: #faf5ff; }
  .items-table td { border-bottom: 1px solid #faf5ff; }
  .totals-section { padding: 8px 18px; background: #faf5ff; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 15px; font-weight: 900; color: #7c3aed; margin-top: 4px; padding-top: 6px; border-top: 2px solid #7c3aed; }
  .courier-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 14px; margin: 6px 14px; border-radius: 0 6px 6px 0; font-size: 11px; color: #92400e; }
  .staff-note { padding: 6px 18px; font-size: 10px; color: #64748b; background: #faf5ff; }
  .memo-footer { text-align: center; padding: 10px 18px; font-size: 9px; color: #a855f7; border-top: 1px solid #e9d5ff; background: #faf5ff; }
  .memo-footer .thank-you { font-weight: 700; color: #7c3aed; font-size: 10px; }
`;

// Template 4: Eco Minimal (green)
const STYLE_4 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; border: 1.5px solid #bbf7d0; }
  .memo-header { background: linear-gradient(135deg, #059669, #047857); color: #fff; padding: 16px 18px; }
  .shop-name { font-size: 16px; font-weight: 800; }
  .shop-logo { height: 30px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #a7f3d0; }
  .order-date { font-size: 10px; color: #6ee7b7; }
  .courier-section { background: #ecfdf5; border-bottom: 1px solid #bbf7d0; padding: 10px 18px; }
  .courier-badge { background: #047857; color: white; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 700; }
  .courier-status { font-size: 9px; font-weight: 700; color: #047857; background: #d1fae5; padding: 2px 8px; border-radius: 6px; }
  .tracking-box { background: #fff; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px 14px; text-align: center; margin-top: 8px; }
  .tracking-label { font-size: 8px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #064e3b; }
  .section { padding: 10px 18px; border-bottom: 1px solid #f0fdf4; }
  .section-title { font-size: 9px; font-weight: 700; color: #059669; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 3px 8px; }
  .info-label { font-size: 10px; font-weight: 600; color: #047857; }
  .info-value { font-size: 11px; font-weight: 500; color: #1e293b; }
  .phone-num { font-family: monospace; font-weight: 700; color: #059669; font-size: 12px; }
  .items-table th { color: #059669; border-bottom: 2px solid #bbf7d0; background: #ecfdf5; }
  .items-table td { border-bottom: 1px solid #f0fdf4; }
  .totals-section { padding: 8px 18px; background: #f0fdf4; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #475569; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 15px; font-weight: 900; color: #047857; margin-top: 4px; padding-top: 6px; border-top: 2px solid #059669; }
  .courier-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 14px; margin: 6px 14px; border-radius: 0 6px 6px 0; font-size: 11px; color: #92400e; }
  .staff-note { padding: 6px 18px; font-size: 10px; color: #64748b; background: #f0fdf4; }
  .memo-footer { text-align: center; padding: 10px 18px; font-size: 9px; color: #059669; border-top: 1px solid #bbf7d0; background: #ecfdf5; }
  .memo-footer .thank-you { font-weight: 700; color: #047857; font-size: 10px; }
`;

// Template 5: Bold Corporate (black/red)
const STYLE_5 = `${COMMON_BASE}
  .memo { max-width: 400px; margin: auto; background: #fff; border-radius: 4px; overflow: hidden; border: 2px solid #1a1a1a; }
  .memo-header { background: #0a0a0a; color: #fff; padding: 16px 18px; }
  .shop-name { font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; }
  .shop-logo { height: 30px; width: auto; }
  .order-num { font-size: 18px; font-weight: 900; color: #ef4444; }
  .order-date { font-size: 10px; color: #737373; }
  .courier-section { background: #fafafa; border-bottom: 2px solid #e5e5e5; padding: 10px 18px; }
  .courier-badge { background: #ef4444; color: white; padding: 3px 10px; border-radius: 2px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
  .courier-status { font-size: 9px; font-weight: 700; text-transform: uppercase; color: #0a0a0a; background: #e5e5e5; padding: 2px 8px; border-radius: 2px; }
  .tracking-box { background: #fff; border: 2px solid #e5e5e5; border-radius: 4px; padding: 8px 14px; text-align: center; margin-top: 8px; }
  .tracking-label { font-size: 8px; color: #737373; text-transform: uppercase; letter-spacing: 2px; }
  .tracking-id { font-size: 16px; font-weight: 900; letter-spacing: 3px; color: #0a0a0a; }
  .section { padding: 10px 18px; border-bottom: 1px solid #f5f5f5; }
  .section-title { font-size: 9px; font-weight: 900; color: #ef4444; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px; }
  .info-grid { display: grid; grid-template-columns: 70px 1fr; gap: 3px 8px; }
  .info-label { font-size: 10px; font-weight: 700; color: #525252; text-transform: uppercase; }
  .info-value { font-size: 11px; font-weight: 500; color: #0a0a0a; }
  .phone-num { font-family: monospace; font-weight: 900; color: #0a0a0a; font-size: 12px; }
  .items-table th { color: #737373; border-bottom: 2px solid #0a0a0a; background: #fafafa; text-transform: uppercase; }
  .items-table td { border-bottom: 1px solid #f5f5f5; }
  .totals-section { padding: 8px 18px; background: #fafafa; }
  .total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; color: #525252; }
  .total-row.discount { color: #ef4444; }
  .total-row.grand-total { font-size: 15px; font-weight: 900; color: #0a0a0a; margin-top: 4px; padding-top: 6px; border-top: 3px solid #0a0a0a; }
  .courier-note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 8px 14px; margin: 6px 14px; font-size: 11px; color: #92400e; }
  .staff-note { padding: 6px 18px; font-size: 10px; color: #525252; background: #fafafa; }
  .memo-footer { text-align: center; padding: 10px 18px; font-size: 9px; color: #737373; border-top: 2px solid #0a0a0a; background: #fafafa; }
  .memo-footer .thank-you { font-weight: 900; color: #0a0a0a; font-size: 10px; text-transform: uppercase; }
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

  const itemRows = d.items.map(it => `
    <tr>
      <td>${it.product_name}</td>
      <td style="text-align:center">${it.product_code || ''}</td>
      <td style="text-align:center">${it.quantity}</td>
      <td style="text-align:right">৳${it.total_price}</td>
    </tr>
  `).join('');

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
