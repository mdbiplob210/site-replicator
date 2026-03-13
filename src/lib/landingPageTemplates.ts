// Pre-built landing page HTML templates

export interface TemplateConfig {
  productName: string;
  subtitle: string;
  originalPrice: string;
  sellingPrice: string;
  discountPercent: string;
  deliveryCharge: string;
  productCode: string;
  phoneNumber: string;
  imageUrl: string;
  // Features
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;
  // Texts
  topBannerText: string;
  ctaButtonText: string;
  whySectionTitle: string;
  // Trust badges
  trustBadge1: string;
  trustBadge2: string;
  trustBadge3: string;
  trustBadge4: string;
  // Additional texts
  countdownText: string;
  reviewText: string;
  callButtonText: string;
  footerText: string;
  // Checkout popup texts
  checkoutTitle: string;
  nameLabel: string;
  namePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  quantityLabel: string;
  qty1Text: string;
  qty2Text: string;
  qty3Text: string;
  productPriceLabel: string;
  deliveryChargeLabel: string;
  totalLabel: string;
  confirmButtonText: string;
  successTitle: string;
  successMessage: string;
  // Tiered pricing
  tieredPricingEnabled: boolean;
  tieredPrice1: string; // price for 1 piece
  tieredPrice2: string; // price for 2 pieces (total)
  tieredPrice3: string; // price for 3 pieces (total)
  tieredLabel1: string;
  tieredLabel2: string;
  tieredLabel3: string;
}

export const defaultTemplateConfig: TemplateConfig = {
  productName: "আপনার প্রোডাক্ট নাম",
  subtitle: "(প্রিমিয়াম কোয়ালিটি)",
  originalPrice: "৯৯০",
  sellingPrice: "৬৯০",
  discountPercent: "৩০",
  deliveryCharge: "60",
  productCode: "SKU001",
  phoneNumber: "01XXXXXXXXX",
  imageUrl: "https://placehold.co/600x600/f5f5f0/333?text=Product+Image",
  feature1Title: "প্রিমিয়াম কোয়ালিটি",
  feature1Desc: "উচ্চমানের উপকরণ দিয়ে তৈরি, যা দীর্ঘদিন টেকসই।",
  feature2Title: "সহজ ব্যবহার",
  feature2Desc: "যেকোনো মানুষ সহজেই ব্যবহার করতে পারবেন।",
  feature3Title: "দীর্ঘস্থায়ী",
  feature3Desc: "একবার কিনলে অনেকদিন ব্যবহার করা যায়।",
  feature4Title: "সহজে পরিষ্কার",
  feature4Desc: "পানি দিয়ে ধুয়ে নিন - কোনো ঝামেলা নেই!",
  topBannerText: "🎉 সীমিত সময়ের অফার - এখনই অর্ডার করুন! 🎉",
  ctaButtonText: "অর্ডার করুন",
  whySectionTitle: "কেন এই প্রোডাক্ট বেছে নেবেন?",
  trustBadge1: "১০০% অরিজিনাল",
  trustBadge2: "দ্রুত ডেলিভারি",
  trustBadge3: "প্রিমিয়াম কোয়ালিটি",
  trustBadge4: "ক্যাশ অন ডেলিভারি",
  countdownText: "অফারটি পাবে আর মাত্র",
  reviewText: "(150+ Reviews)",
  callButtonText: "অর্ডার করতে কল করুন",
  footerText: "© " + new Date().getFullYear() + " সর্বস্বত্ব সংরক্ষিত",
  checkoutTitle: "🛒 অর্ডার করুন",
  nameLabel: "আপনার নাম *",
  namePlaceholder: "আপনার পুরো নাম লিখুন",
  phoneLabel: "মোবাইল নম্বর *",
  phonePlaceholder: "01XXXXXXXXX",
  addressLabel: "সম্পূর্ণ ঠিকানা *",
  addressPlaceholder: "বাসা, রাস্তা, এলাকা, জেলা",
  quantityLabel: "পরিমাণ",
  qty1Text: "১ পিস",
  qty2Text: "২ পিস",
  qty3Text: "৩ পিস",
  productPriceLabel: "প্রোডাক্ট মূল্য:",
  deliveryChargeLabel: "ডেলিভারি চার্জ:",
  totalLabel: "সর্বমোট:",
  confirmButtonText: "✅ অর্ডার কনফার্ম করুন",
  successTitle: "অর্ডার সফল হয়েছে!",
  successMessage: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।",
  // Tiered pricing defaults
  tieredPricingEnabled: false,
  tieredPrice1: "৬৯০",
  tieredPrice2: "১২৮০",
  tieredPrice3: "১৮০০",
  tieredLabel1: "১ পিস - ৳৬৯০",
  tieredLabel2: "২ পিস - ৳১২৮০ (সেভ ৳১০০)",
  tieredLabel3: "৩ পিস - ৳১৮০০ (সেভ ৳২৭০)",
};

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  preview: string; // emoji/icon representation
  color: string;
}

export const templateList: TemplateInfo[] = [
  { id: "classic-orange", name: "ক্লাসিক অরেঞ্জ", description: "অরেঞ্জ গ্র্যাডিয়েন্ট, কাউন্টডাউন, ট্রাস্ট ব্যাজ", preview: "🟠", color: "#ff6b00" },
  { id: "modern-blue", name: "মডার্ন ব্লু", description: "নীল থিম, ক্লিন ডিজাইন, স্লিক অ্যানিমেশন", preview: "🔵", color: "#1a73e8" },
  { id: "elegant-dark", name: "এলিগ্যান্ট ডার্ক", description: "ডার্ক মোড, গোল্ড অ্যাকসেন্ট, প্রিমিয়াম লুক", preview: "⚫", color: "#1a1a2e" },
  { id: "fresh-green", name: "ফ্রেশ গ্রীন", description: "সবুজ থিম, ন্যাচারাল/অর্গানিক প্রোডাক্টের জন্য", preview: "🟢", color: "#2e7d32" },
  { id: "vibrant-gradient", name: "ভাইব্র্যান্ট গ্র্যাডিয়েন্ট", description: "রঙিন গ্র্যাডিয়েন্ট, বোল্ড টাইপোগ্রাফি", preview: "🟣", color: "#7c3aed" },
  { id: "minimal-white", name: "মিনিমাল হোয়াইট", description: "ক্লিন সাদা ব্যাকগ্রাউন্ড, সিম্পল ডিজাইন", preview: "⚪", color: "#333" },
];

// ═══════════════════════════════════════════
// Tiered pricing section for landing page body
// ═══════════════════════════════════════════
function tieredPricingSectionHtml(p: TemplateConfig, accentColor: string, isDark: boolean = false) {
  if (!p.tieredPricingEnabled) return '';
  const t1 = parseInt(p.tieredPrice1?.replace(/[^\d]/g,'') || '') || parseInt(p.sellingPrice.replace(/[^\d]/g,'')) || 0;
  const t2 = parseInt(p.tieredPrice2?.replace(/[^\d]/g,'') || '') || (t1 * 2);
  const t3 = parseInt(p.tieredPrice3?.replace(/[^\d]/g,'') || '') || (t1 * 3);

  const bgCard = isDark ? '#1a1a1a' : '#fff';
  const bgSelected = isDark ? '#2a2a2a' : `${accentColor}08`;
  const borderDefault = isDark ? '#333' : '#e8e8e8';
  const textPrimary = isDark ? '#e0e0e0' : '#111';
  const textSecondary = isDark ? '#999' : '#666';
  const saveBg = isDark ? 'rgba(76,175,80,0.15)' : '#e8f5e9';
  const saveColor = isDark ? '#66bb6a' : '#2e7d32';
  const checkBg = accentColor;
  const popularBg = `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`;

  return `
<div id="tieredPricingSection" style="padding:0 16px;margin:20px 0">
  <style>
    .tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    @media(max-width:480px){.tier-grid{gap:6px}.tier-card{padding:10px 6px}.tier-label{font-size:12px}.tier-price{font-size:17px}.tier-per{font-size:9px}}
    .tier-card{position:relative;border:2px solid ${borderDefault};border-radius:14px;padding:14px 10px;cursor:pointer;transition:all .3s ease;background:${bgCard};display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
    .tier-card:hover{border-color:${accentColor}88;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.1)}
    .tier-card.selected{border-color:${accentColor};background:${bgSelected};box-shadow:0 4px 20px ${accentColor}22}
    .tier-radio{width:22px;height:22px;border-radius:50%;border:2px solid ${borderDefault};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
    .tier-card.selected .tier-radio{border-color:${checkBg};background:${checkBg}}
    .tier-radio-dot{width:9px;height:9px;border-radius:50%;background:#fff;display:none}
    .tier-card.selected .tier-radio-dot{display:block}
    .tier-label{font-size:14px;font-weight:700;color:${textPrimary}}
    .tier-price{font-size:22px;font-weight:800;color:${accentColor};line-height:1.1}
    .tier-per-piece{font-size:11px;color:${textSecondary}}
    .tier-save{display:inline-block;background:${saveBg};color:${saveColor};font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:2px}
    .tier-popular{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:${popularBg};color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:20px;white-space:nowrap;letter-spacing:.3px}
  </style>

  <div class="tier-grid">
    <div class="tier-card selected" onclick="selectTier(1)" id="tierCard1">
      <div class="tier-radio"><div class="tier-radio-dot"></div></div>
      <div class="tier-label">${p.tieredLabel1 || '১ পিস'}</div>
      <div class="tier-price">৳${t1}</div>
      <div class="tier-per-piece">প্রতি পিস ৳${t1}</div>
    </div>

    <div class="tier-card" onclick="selectTier(2)" id="tierCard2">
      <div class="tier-popular">🔥 জনপ্রিয়</div>
      <div class="tier-radio"><div class="tier-radio-dot"></div></div>
      <div class="tier-label">${p.tieredLabel2 || '২ পিস'}</div>
      <div class="tier-price">৳${t2}</div>
      <div class="tier-per-piece">প্রতি পিস ৳${Math.round(t2/2)}</div>
      ${t2 < t1*2 ? `<div class="tier-save">সেভ ৳${t1*2-t2}</div>` : ''}
    </div>

    <div class="tier-card" onclick="selectTier(3)" id="tierCard3">
      <div class="tier-radio"><div class="tier-radio-dot"></div></div>
      <div class="tier-label">${p.tieredLabel3 || '৩ পিস'}</div>
      <div class="tier-price">৳${t3}</div>
      <div class="tier-per-piece">প্রতি পিস ৳${Math.round(t3/3)}</div>
      ${t3 < t1*3 ? `<div class="tier-save">সেভ ৳${t1*3-t3}</div>` : ''}
    </div>
  </div>
</div>
<script>
var selectedTier=1;
var tieredPricesPage={1:${t1},2:${t2},3:${t3}};
function selectTier(n){
  selectedTier=n;
  document.querySelectorAll('.tier-card').forEach(function(c){c.classList.remove('selected')});
  document.getElementById('tierCard'+n).classList.add('selected');
}
</script>`;
}

// Tiered CSS for the landing page
function tieredPricingStyles() {
  return '';
}

// Shared checkout popup HTML — styled like main website PopupCheckout
function checkoutPopupHtml(p: TemplateConfig, accentColor: string, bgOverlay: string = "rgba(0,0,0,0.6)") {
  const basePrice = parseInt(p.sellingPrice.replace(/[^\d]/g,'')) || 0;
  const dc = parseInt(p.deliveryCharge) || 0;
  const useTiered = p.tieredPricingEnabled;
  const t1 = parseInt(p.tieredPrice1?.replace(/[^\d]/g,'') || '') || basePrice;
  const t2 = parseInt(p.tieredPrice2?.replace(/[^\d]/g,'') || '') || (basePrice * 2);
  const t3 = parseInt(p.tieredPrice3?.replace(/[^\d]/g,'') || '') || (basePrice * 3);

  const quantityHtml = useTiered ? `
        <input type="hidden" name="quantity" id="checkoutQtyHidden" value="1"/>` : `
        <div style="margin-bottom:16px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#666;margin-bottom:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            ${p.quantityLabel}
          </label>
          <div style="display:flex;align-items:center;border:2px solid #e8e8e8;border-radius:12px;overflow:hidden;width:fit-content">
            <button type="button" onclick="changeQty(-1)" style="padding:10px 16px;background:none;border:none;cursor:pointer;font-size:18px;color:#555">−</button>
            <span id="qtyDisplay" style="padding:8px 16px;font-weight:700;font-size:15px;min-width:40px;text-align:center">1</span>
            <button type="button" onclick="changeQty(1)" style="padding:10px 16px;background:none;border:none;cursor:pointer;font-size:18px;color:#555">+</button>
          </div>
          <input type="hidden" name="quantity" id="qtyHidden" value="1"/>
        </div>`;

  const summaryScript = useTiered ? `
var tieredPrices={1:${t1},2:${t2},3:${t3}},deliveryCharge=${dc};
function syncTierToCheckout(){
  var q=typeof selectedTier!=='undefined'?selectedTier:1;
  document.getElementById('checkoutQtyHidden').value=q;
  var productPrice=tieredPrices[q]||tieredPrices[1];
  document.getElementById('sumProduct').textContent='৳'+productPrice;
  var dcArea=document.getElementById('deliveryChargeAmount');
  var dcVal=dcArea?parseInt(dcArea.dataset.charge)||deliveryCharge:deliveryCharge;
  document.getElementById('sumTotal').textContent='৳'+(productPrice+dcVal);
  document.getElementById('checkoutForm').setAttribute('data-unit-price', String(Math.round(productPrice/q)));
}
` : `
var unitPrice=${basePrice},deliveryCharge=${dc},currentQty=1;
function changeQty(d){currentQty=Math.max(1,Math.min(10,currentQty+d));document.getElementById('qtyDisplay').textContent=currentQty;document.getElementById('qtyHidden').value=currentQty;updateSummary()}
function updateSummary(){var q=currentQty;document.getElementById('sumProduct').textContent='৳'+(unitPrice*q);var dcArea=document.getElementById('deliveryChargeAmount');var dcVal=dcArea?parseInt(dcArea.dataset.charge)||deliveryCharge:deliveryCharge;document.getElementById('sumTotal').textContent='৳'+(unitPrice*q+dcVal)}
`;

  const initialProductPrice = useTiered ? t1 : basePrice;
  const initialTotal = initialProductPrice + dc;

  const selectedTierDisplay = useTiered ? `
        <div id="selectedTierInfo" style="background:linear-gradient(135deg,${accentColor}08,${accentColor}04);border:2px solid ${accentColor}33;border-radius:14px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px">
          <div style="width:40px;height:40px;background:${accentColor}15;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><span style="font-size:20px">📦</span></div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:#111" id="tierInfoLabel">${p.tieredLabel1 || '১ পিস'}</div>
            <div style="font-size:15px;color:${accentColor};font-weight:800" id="tierInfoPrice">৳${t1}</div>
          </div>
          <div style="font-size:11px;color:#888;text-align:right">পেজ থেকে<br/>সিলেক্টেড</div>
        </div>` : '';

  return `
<!-- Checkout Popup -->
<div class="checkout-overlay" id="checkoutOverlay" style="display:none;position:fixed;inset:0;background:${bgOverlay};backdrop-filter:blur(6px);z-index:9999;align-items:flex-end;justify-content:center">
  <div style="background:#fff;width:100%;max-width:500px;border-radius:28px 28px 0 0;max-height:92vh;overflow-y:auto;animation:slideUp .35s cubic-bezier(.22,1,.36,1);box-shadow:0 -12px 60px rgba(0,0,0,0.2)">
    
    <!-- Drag Handle -->
    <div style="display:flex;justify-content:center;padding:10px 0 0"><div style="width:40px;height:4px;border-radius:4px;background:#ddd"></div></div>

    <!-- Product Header with Gradient -->
    <div style="position:relative;padding:16px 20px 14px;background:linear-gradient(135deg,${accentColor}08,${accentColor}03);border-bottom:1px solid #f0f0f0">
      <button onclick="closeCheckout()" style="position:absolute;top:14px;right:16px;z-index:10;width:34px;height:34px;border-radius:50%;background:#f3f4f6;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:17px;color:#888;transition:all .2s;box-shadow:0 1px 4px rgba(0,0,0,0.06)" onmouseover="this.style.background='#e5e7eb';this.style.color='#333'" onmouseout="this.style.background='#f3f4f6';this.style.color='#888'">✕</button>
      <div style="display:flex;align-items:center;gap:14px">
        <div style="width:64px;height:64px;border-radius:16px;overflow:hidden;background:#f5f5f0;flex-shrink:0;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:2px solid #fff">
          <img src="${p.imageUrl}" alt="${p.productName}" style="width:100%;height:100%;object-fit:cover"/>
        </div>
        <div style="flex:1;min-width:0;padding-right:36px">
          <h3 style="font-size:15px;font-weight:800;color:#111;margin:0 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.productName}</h3>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <span style="font-size:22px;font-weight:800;color:${accentColor}">৳${p.sellingPrice}</span>
            <span style="font-size:13px;text-decoration:line-through;color:#bbb">৳${p.originalPrice}</span>
            <span style="background:#ff17441a;color:#ef4444;font-size:11px;font-weight:700;padding:2px 8px;border-radius:8px">${p.discountPercent}% OFF</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Scarcity Banner -->
    <div style="background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:600">
      <span style="animation:pulse 2s infinite">🔥</span>
      <span>শুধুমাত্র <strong style="font-size:16px;background:rgba(255,255,255,0.2);padding:1px 8px;border-radius:6px" id="scarcityNum">47</strong> জনের জন্য এই অফার!</span>
      <span style="animation:pulse 2s infinite">⏰</span>
    </div>

    <!-- Form -->
    <form data-checkout-form data-product-name="${p.productName}" data-product-code="${p.productCode}" data-unit-price="${useTiered ? t1 : basePrice}" data-delivery-charge="${p.deliveryCharge}" id="checkoutForm" style="padding:18px 20px 28px">
      <div id="formFields">
        ${selectedTierDisplay}

        <!-- Name -->
        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#555;margin-bottom:7px;text-transform:uppercase;letter-spacing:.3px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ${p.nameLabel}
          </label>
          <input type="text" name="customer_name" placeholder="${p.namePlaceholder}" required style="width:100%;padding:14px 16px;border:2px solid #e8e8e8;border-radius:14px;font-size:15px;outline:none;transition:all .25s;background:#fafafa" onfocus="this.style.borderColor='${accentColor}';this.style.background='#fff';this.style.boxShadow='0 0 0 3px ${accentColor}15'" onblur="this.style.borderColor='#e8e8e8';this.style.background='#fafafa';this.style.boxShadow='none'" />
        </div>

        <!-- Phone -->
        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#555;margin-bottom:7px;text-transform:uppercase;letter-spacing:.3px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            ${p.phoneLabel}
          </label>
          <input type="tel" name="customer_phone" placeholder="${p.phonePlaceholder}" required style="width:100%;padding:14px 16px;border:2px solid #e8e8e8;border-radius:14px;font-size:15px;outline:none;transition:all .25s;background:#fafafa" onfocus="this.style.borderColor='${accentColor}';this.style.background='#fff';this.style.boxShadow='0 0 0 3px ${accentColor}15'" onblur="this.style.borderColor='#e8e8e8';this.style.background='#fafafa';this.style.boxShadow='none'" inputmode="tel" maxlength="11" />
        </div>

        <!-- Address -->
        <div style="margin-bottom:16px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#555;margin-bottom:7px;text-transform:uppercase;letter-spacing:.3px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${accentColor}" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${p.addressLabel}
          </label>
          <textarea name="customer_address" placeholder="${p.addressPlaceholder}" required style="width:100%;padding:14px 16px;border:2px solid #e8e8e8;border-radius:14px;font-size:15px;outline:none;resize:none;min-height:56px;transition:all .25s;background:#fafafa" onfocus="this.style.borderColor='${accentColor}';this.style.background='#fff';this.style.boxShadow='0 0 0 3px ${accentColor}15'" onblur="this.style.borderColor='#e8e8e8';this.style.background='#fafafa';this.style.boxShadow='none'"></textarea>
        </div>

        ${quantityHtml}

        <!-- Delivery Area -->
        <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;padding:14px;margin-bottom:16px;border:1px solid #e2e8f0">
          <label style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;display:flex;align-items:center;gap:6px;text-transform:uppercase;letter-spacing:.3px">📍 ডেলিভারি এরিয়া</label>
          <div style="display:flex;gap:8px">
            <button type="button" onclick="setDeliveryArea('inside',${dc})" id="areaInside" style="flex:1;padding:12px;border-radius:12px;font-size:13px;font-weight:700;border:2px solid ${accentColor};background:${accentColor}0d;color:${accentColor};cursor:pointer;transition:all .25s">
              <span style="display:block;font-size:15px;margin-bottom:2px">🏙️</span>ঢাকার ভিতরে<br/><strong>৳${dc}</strong>
            </button>
            <button type="button" onclick="setDeliveryArea('outside',${Math.round(dc * 1.8)})" id="areaOutside" style="flex:1;padding:12px;border-radius:12px;font-size:13px;font-weight:700;border:2px solid #e2e8f0;background:#fff;color:#666;cursor:pointer;transition:all .25s">
              <span style="display:block;font-size:15px;margin-bottom:2px">🌍</span>ঢাকার বাইরে<br/><strong>৳${Math.round(dc * 1.8)}</strong>
            </button>
          </div>
        </div>

        <!-- Summary -->
        <div style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:16px;padding:16px;margin-bottom:18px;border:1px solid #e2e8f0">
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:5px 0;color:#666"><span>${p.productPriceLabel}</span><span style="color:#111;font-weight:700" id="sumProduct">৳${initialProductPrice}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:5px 0;color:#666"><span>${p.deliveryChargeLabel}</span><span id="deliveryChargeAmount" data-charge="${dc}" style="color:#111;font-weight:700">৳${dc}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:800;border-top:2px dashed #e2e8f0;margin-top:10px;padding-top:12px"><span>${p.totalLabel}</span><span style="color:${accentColor}" id="sumTotal">৳${initialTotal}</span></div>
        </div>

        <!-- Submit -->
        <button type="submit" id="submitBtn" style="width:100%;padding:17px;font-size:18px;font-weight:800;color:#fff;background:linear-gradient(135deg,${accentColor},${accentColor}cc);border:none;border-radius:16px;cursor:pointer;box-shadow:0 6px 20px ${accentColor}33;transition:all .25s;display:flex;align-items:center;justify-content:center;gap:8px;letter-spacing:.3px" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 28px ${accentColor}44'" onmouseout="this.style.transform='';this.style.boxShadow='0 6px 20px ${accentColor}33'">🛒 ${p.confirmButtonText}</button>

        <!-- Trust icons row -->
        <div style="display:flex;justify-content:center;gap:16px;margin-top:14px;padding-bottom:4px">
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999"><span>💳</span> ক্যাশ অন ডেলিভারি</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999"><span>🚚</span> ২-৫ দিনে ডেলিভারি</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:#999"><span>🔒</span> নিরাপদ</div>
        </div>
      </div>

      <!-- Success -->
      <div id="successMsg" style="display:none;text-align:center;padding:48px 20px">
        <div style="width:88px;height:88px;background:linear-gradient(135deg,#dcfce7,#bbf7d0);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;box-shadow:0 8px 30px rgba(22,163,74,0.15);animation:popIn .5s cubic-bezier(.22,1,.36,1)"><span style="font-size:44px">✅</span></div>
        <h3 style="font-size:24px;font-weight:800;color:#111;margin:0 0 10px">${p.successTitle} 🎉</h3>
        <p style="color:#555;font-size:15px;margin:0 0 8px;line-height:1.7">${p.successMessage}</p>
        <p style="color:#888;font-size:13px;margin:0 0 28px;line-height:1.5">আপনাকে কিছুক্ষণের মধ্যে আমাদের Customer Care থেকে কল দেওয়া হবে।</p>
        <button onclick="closeCheckout()" style="padding:14px 40px;font-size:15px;font-weight:700;color:#fff;background:${accentColor};border:none;border-radius:14px;cursor:pointer;box-shadow:0 4px 14px ${accentColor}33;transition:all .2s">ঠিক আছে</button>
      </div>
    </form>
  </div>
</div>
<style>
@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes popIn{0%{transform:scale(0.5);opacity:0}100%{transform:scale(1);opacity:1}}
</style>
<script>
var currentDeliveryCharge=${dc};
function setDeliveryArea(area,charge){
  currentDeliveryCharge=charge;
  document.getElementById('deliveryChargeAmount').textContent='৳'+charge;
  document.getElementById('deliveryChargeAmount').dataset.charge=charge;
  document.getElementById('checkoutForm').setAttribute('data-delivery-charge',charge);
  var insBtn=document.getElementById('areaInside'),outBtn=document.getElementById('areaOutside');
  if(area==='inside'){insBtn.style.borderColor='${accentColor}';insBtn.style.background='${accentColor}0d';insBtn.style.color='${accentColor}';outBtn.style.borderColor='#e2e8f0';outBtn.style.background='#fff';outBtn.style.color='#666'}
  else{outBtn.style.borderColor='${accentColor}';outBtn.style.background='${accentColor}0d';outBtn.style.color='${accentColor}';insBtn.style.borderColor='#e2e8f0';insBtn.style.background='#fff';insBtn.style.color='#666'}
  ${useTiered ? 'syncTierToCheckout()' : 'updateSummary()'}
}
// Scarcity countdown
var scCount=47;setInterval(function(){scCount=scCount<=3?47:scCount-1;var el=document.getElementById('scarcityNum');if(el)el.textContent=scCount},5000);

function openCheckout(){document.getElementById('checkoutOverlay').style.display='flex';document.getElementById('checkoutOverlay').style.alignItems='flex-end';document.getElementById('checkoutOverlay').style.justifyContent='center';document.body.style.overflow='hidden';${useTiered ? 'syncTierToCheckout();var labels=["","'+p.tieredLabel1.replace(/'/g,"\\'")+'","'+p.tieredLabel2.replace(/'/g,"\\'")+'","'+p.tieredLabel3.replace(/'/g,"\\'")+'"];if(document.getElementById("tierInfoLabel"))document.getElementById("tierInfoLabel").textContent=labels[selectedTier]||labels[1];if(document.getElementById("tierInfoPrice"))document.getElementById("tierInfoPrice").textContent="৳"+tieredPrices[selectedTier];' : ''}}
function closeCheckout(){document.getElementById('checkoutOverlay').style.display='none';document.body.style.overflow='';document.getElementById('formFields').style.display='';document.getElementById('successMsg').style.display='none'}
document.getElementById('checkoutOverlay').addEventListener('click',function(e){if(e.target===this)closeCheckout()});
${summaryScript}
document.getElementById('checkoutForm').addEventListener('submit',function(e){e.preventDefault();var btn=document.getElementById('submitBtn');btn.disabled=true;btn.innerHTML='<span style="display:inline-block;width:18px;height:18px;border:2.5px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin .6s linear infinite;margin-right:8px"></span> সাবমিট হচ্ছে...';var fd=new FormData(this);var q=parseInt(fd.get('quantity'))||1;var dcVal=parseInt(this.dataset.deliveryCharge)||${dc};var data={customer_name:fd.get('customer_name'),customer_phone:fd.get('customer_phone'),customer_address:fd.get('customer_address'),quantity:q,product_name:this.dataset.productName,product_code:this.dataset.productCode,unit_price:parseInt(this.dataset.unitPrice)||0,delivery_charge:dcVal};data.total_amount=(data.unit_price*q)+dcVal;${useTiered ? 'var tp={1:'+t1+',2:'+t2+',3:'+t3+'};data.unit_price=Math.round((tp[q]||tp[1])/q);data.total_amount=(tp[q]||tp[1])+dcVal;' : ''}fetch((window.SUPABASE_URL||'')+ '/functions/v1/submit-landing-order',{method:'POST',headers:{'Content-Type':'application/json','apikey':window.SUPABASE_ANON_KEY||''},body:JSON.stringify(data)}).then(function(){document.getElementById('formFields').style.display='none';document.getElementById('successMsg').style.display='block'}).catch(function(){document.getElementById('formFields').style.display='none';document.getElementById('successMsg').style.display='block'}).finally(function(){btn.disabled=false;btn.innerHTML='🛒 ${p.confirmButtonText}'})});
</script>
<style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
}

// Countdown script
function countdownScript() {
  return `<script>
var cEl=document.getElementById('countdown-num');
if(cEl){var c=parseInt(cEl.textContent)||69;setInterval(function(){if(c>10){c--;cEl.textContent=c}},Math.random()*30000+15000)}
</script>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 1: Classic Orange
// ═══════════════════════════════════════════
export function templateClassicOrange(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;background:#fff;color:#333;line-height:1.6}
.top-banner{background:linear-gradient(135deg,#ff6b00,#ff9800);color:#fff;text-align:center;padding:12px 16px;font-size:15px;font-weight:600;position:sticky;top:0;z-index:100}
.countdown-bar{background:linear-gradient(135deg,#e91e63,#ff5722);color:#fff;text-align:center;padding:14px 16px;font-size:16px;border-radius:12px;margin:16px;display:flex;align-items:center;justify-content:center;gap:8px}
.countdown-bar .count-num{background:rgba(255,255,255,0.3);padding:4px 14px;border-radius:50%;font-size:22px;font-weight:800}
.product-hero{margin:0 16px;border-radius:16px;overflow:hidden;border:1px solid #eee;background:#fafaf5}
.product-hero img{width:100%;height:auto;display:block}
.product-info{text-align:center;padding:24px 16px 8px}
.product-info h1{font-size:26px;font-weight:800;color:#111}
.product-info .subtitle{color:#ff6b00;font-size:18px;font-weight:700;margin-top:2px}
.stars{margin:12px 0 8px;font-size:20px;color:#f5a623}.reviews{color:#888;font-size:14px}
.price-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;flex-wrap:wrap}
.price-old{text-decoration:line-through;color:#999;font-size:18px}
.price-new{font-size:32px;font-weight:800;color:#111}
.discount-badge{background:#ff1744;color:#fff;padding:4px 14px;border-radius:20px;font-size:14px;font-weight:700}
.cta-section{padding:20px 16px}
.btn-order{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px;font-size:20px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff6b00,#ff9800);border:none;border-radius:12px;cursor:pointer;margin-bottom:12px}
.btn-call{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:16px;font-size:17px;font-weight:700;color:#fff;background:#2e7d32;border:none;border-radius:12px;cursor:pointer;text-decoration:none}
.trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:24px 16px}
.trust-card{background:#f5f5f0;border-radius:14px;padding:20px 12px;text-align:center}
.trust-card .icon{font-size:32px;margin-bottom:8px}.trust-card p{font-size:14px;font-weight:600}
.features-section{padding:32px 16px}
.features-section h2{text-align:center;font-size:22px;font-weight:800;margin-bottom:20px}
.feature-card{background:#fafaf5;border:1px solid #eee;border-radius:14px;padding:20px;margin-bottom:14px}
.feature-card h3{color:#ff6b00;font-size:17px;font-weight:700;margin-bottom:6px}
.feature-card p{color:#666;font-size:14px}
.lp-footer{background:#f5f5f0;padding:24px 16px;text-align:center;margin-top:32px}.lp-footer p{color:#999;font-size:12px}
</style></head><body>
<div class="top-banner">${p.topBannerText}</div>
<div class="countdown-bar">${p.countdownText} <span class="count-num" id="countdown-num">69</span> জন</div>
<div class="product-hero"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="product-info">
  <h1>${p.productName}</h1><div class="subtitle">${p.subtitle}</div>
  <div class="stars">⭐⭐⭐⭐⭐ <span class="reviews">${p.reviewText}</span></div>
  <div class="price-row"><span class="price-old">৳${p.originalPrice}</span><span class="price-new">৳ ${p.sellingPrice}</span><span class="discount-badge">${p.discountPercent}% ছাড়</span></div>
</div>
${tieredPricingSectionHtml(p, '#ff6b00')}
<div class="cta-section">
  <button class="btn-order" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-call">📞 ${p.callButtonText}: ${p.phoneNumber}</a>
</div>
<div class="trust-grid">
  <div class="trust-card"><div class="icon">🛡️</div><p>${p.trustBadge1}</p></div>
  <div class="trust-card"><div class="icon">🚚</div><p>${p.trustBadge2}</p></div>
  <div class="trust-card"><div class="icon">🏅</div><p>${p.trustBadge3}</p></div>
  <div class="trust-card"><div class="icon">📞</div><p>${p.trustBadge4}</p></div>
</div>
<div class="features-section">
  <h2>${p.whySectionTitle}</h2>
  <div class="feature-card"><h3>✅ ${p.feature1Title}</h3><p>${p.feature1Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature2Title}</h3><p>${p.feature2Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature3Title}</h3><p>${p.feature3Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature4Title}</h3><p>${p.feature4Desc}</p></div>
</div>
<div class="cta-section"><button class="btn-order" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="lp-footer"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#ff6b00')}
${countdownScript()}
</body></html>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 2: Modern Blue
// ═══════════════════════════════════════════
export function templateModernBlue(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;color:#1a202c;line-height:1.6}
.top-strip{background:linear-gradient(90deg,#1a73e8,#4285f4);color:#fff;text-align:center;padding:10px;font-size:14px;font-weight:600;position:sticky;top:0;z-index:100}
.hero-card{background:#fff;margin:16px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.hero-card img{width:100%;height:auto;display:block}
.hero-body{padding:20px}
.hero-body h1{font-size:24px;font-weight:800;color:#1a202c;margin-bottom:4px}
.hero-body .tag{display:inline-block;background:#e8f0fe;color:#1a73e8;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:12px}
.rating{display:flex;align-items:center;gap:6px;margin-bottom:16px}.rating .stars{color:#f5a623;font-size:16px}.rating .count{color:#718096;font-size:13px}
.price-box{display:flex;align-items:baseline;gap:10px;margin-bottom:16px}
.price-box .old{text-decoration:line-through;color:#a0aec0;font-size:16px}
.price-box .new{font-size:30px;font-weight:800;color:#1a73e8}
.price-box .save{background:#ff1744;color:#fff;padding:3px 10px;border-radius:16px;font-size:12px;font-weight:700}
.btn-primary{display:block;width:100%;padding:16px;font-size:18px;font-weight:700;color:#fff;background:linear-gradient(135deg,#1a73e8,#4285f4);border:none;border-radius:14px;cursor:pointer;text-align:center;margin-bottom:10px}
.btn-secondary{display:block;width:100%;padding:14px;font-size:16px;font-weight:600;color:#fff;background:#2e7d32;border:none;border-radius:14px;cursor:pointer;text-align:center;text-decoration:none}
.badges{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:0 16px;margin:20px 0}
.badge-item{background:#fff;border-radius:12px;padding:14px 6px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.badge-item .bi{font-size:24px;margin-bottom:4px;display:block}.badge-item span{font-size:11px;font-weight:600;color:#4a5568}
.why-section{padding:24px 16px}
.why-section h2{font-size:20px;font-weight:800;text-align:center;margin-bottom:16px}
.why-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);border-left:4px solid #1a73e8}
.why-card h4{font-size:15px;font-weight:700;color:#1a73e8;margin-bottom:4px}.why-card p{font-size:13px;color:#718096}
.footer{text-align:center;padding:20px;color:#a0aec0;font-size:11px}
</style></head><body>
<div class="top-strip">${p.topBannerText}</div>
<div class="hero-card">
  <img src="${p.imageUrl}" alt="${p.productName}"/>
  <div class="hero-body">
    <span class="tag">${p.subtitle}</span>
    <h1>${p.productName}</h1>
    <div class="rating"><span class="stars">★★★★★</span><span class="count">${p.reviewText}</span></div>
    <div class="price-box"><span class="old">৳${p.originalPrice}</span><span class="new">৳${p.sellingPrice}</span><span class="save">${p.discountPercent}% OFF</span></div>
    ${tieredPricingSectionHtml(p, '#1a73e8')}
    <button class="btn-primary" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
    <a href="tel:${p.phoneNumber}" class="btn-secondary">📞 ${p.callButtonText}: ${p.phoneNumber}</a>
  </div>
</div>
<div class="badges">
  <div class="badge-item"><span class="bi">✓</span><span>${p.trustBadge1}</span></div>
  <div class="badge-item"><span class="bi">🚀</span><span>${p.trustBadge2}</span></div>
  <div class="badge-item"><span class="bi">🏅</span><span>${p.trustBadge3}</span></div>
  <div class="badge-item"><span class="bi">💵</span><span>${p.trustBadge4}</span></div>
</div>
<div class="why-section">
  <h2>${p.whySectionTitle}</h2>
  <div class="why-card"><h4>💎 ${p.feature1Title}</h4><p>${p.feature1Desc}</p></div>
  <div class="why-card"><h4>⚡ ${p.feature2Title}</h4><p>${p.feature2Desc}</p></div>
  <div class="why-card"><h4>🔧 ${p.feature3Title}</h4><p>${p.feature3Desc}</p></div>
  <div class="why-card"><h4>✨ ${p.feature4Title}</h4><p>${p.feature4Desc}</p></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-primary" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#1a73e8')}
</body></html>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 3: Elegant Dark
// ═══════════════════════════════════════════
export function templateElegantDark(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;background:#0d0d0d;color:#e0e0e0;line-height:1.7}
.gold-bar{background:linear-gradient(90deg,#b8860b,#daa520,#b8860b);color:#1a1a2e;text-align:center;padding:10px;font-size:13px;font-weight:700;letter-spacing:1px;position:sticky;top:0;z-index:100}
.hero{position:relative;margin:16px;border-radius:16px;overflow:hidden;border:1px solid #333}
.hero img{width:100%;height:auto;display:block}
.hero-overlay{background:linear-gradient(transparent 40%,rgba(0,0,0,0.9));position:absolute;bottom:0;left:0;right:0;padding:20px}
.hero-overlay h1{font-size:24px;font-weight:700;color:#fff;margin-bottom:4px}
.hero-overlay .sub{color:#daa520;font-size:14px;font-weight:600}
.info-section{padding:20px 16px;text-align:center}
.info-section .stars{color:#daa520;font-size:18px;margin-bottom:8px}
.price-display{display:flex;align-items:baseline;justify-content:center;gap:12px;margin:12px 0}
.price-display .was{text-decoration:line-through;color:#666;font-size:16px}
.price-display .now{font-size:34px;font-weight:700;color:#daa520;font-family:Georgia,serif}
.price-display .off{background:#daa520;color:#000;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:700}
.btn-gold{display:block;width:calc(100% - 32px);margin:0 16px 10px;padding:16px;font-size:18px;font-weight:700;color:#000;background:linear-gradient(135deg,#daa520,#f4c542);border:none;border-radius:10px;cursor:pointer;text-align:center;letter-spacing:.5px}
.btn-dark-call{display:block;width:calc(100% - 32px);margin:0 16px 20px;padding:14px;font-size:15px;font-weight:600;color:#daa520;background:transparent;border:2px solid #daa520;border-radius:10px;cursor:pointer;text-align:center;text-decoration:none}
.features-dark{padding:24px 16px}
.features-dark h2{text-align:center;color:#daa520;font-size:20px;margin-bottom:16px;font-weight:700}
.fd-card{border:1px solid #333;border-radius:12px;padding:16px;margin-bottom:12px;background:#1a1a1a}
.fd-card h4{color:#daa520;font-size:15px;margin-bottom:4px}.fd-card p{color:#999;font-size:13px}
.dark-badges{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 16px;margin-bottom:24px}
.db-item{border:1px solid #333;border-radius:10px;padding:14px;text-align:center;background:#111}
.db-item .di{font-size:24px;margin-bottom:4px;display:block}.db-item span{font-size:12px;color:#ccc;font-weight:600}
.footer-dark{text-align:center;padding:20px;border-top:1px solid #222;color:#555;font-size:11px;margin-top:16px}
</style></head><body>
<div class="gold-bar">✦ ${p.topBannerText} ✦</div>
<div class="hero">
  <img src="${p.imageUrl}" alt="${p.productName}"/>
  <div class="hero-overlay"><h1>${p.productName}</h1><div class="sub">${p.subtitle}</div></div>
</div>
<div class="info-section">
  <div class="stars">★★★★★ <span style="color:#888;font-size:13px">${p.reviewText}</span></div>
  <div class="price-display"><span class="was">৳${p.originalPrice}</span><span class="now">৳${p.sellingPrice}</span><span class="off">${p.discountPercent}% OFF</span></div>
</div>
${tieredPricingSectionHtml(p, '#daa520', true)}
<button class="btn-gold" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
<a href="tel:${p.phoneNumber}" class="btn-dark-call">📞 ${p.callButtonText}: ${p.phoneNumber}</a>
<div class="dark-badges">
  <div class="db-item"><span class="di">🛡️</span><span>${p.trustBadge1}</span></div>
  <div class="db-item"><span class="di">🚚</span><span>${p.trustBadge2}</span></div>
  <div class="db-item"><span class="di">💎</span><span>${p.trustBadge3}</span></div>
  <div class="db-item"><span class="di">💰</span><span>${p.trustBadge4}</span></div>
</div>
<div class="features-dark">
  <h2>${p.whySectionTitle}</h2>
  <div class="fd-card"><h4>✦ ${p.feature1Title}</h4><p>${p.feature1Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature2Title}</h4><p>${p.feature2Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature3Title}</h4><p>${p.feature3Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature4Title}</h4><p>${p.feature4Desc}</p></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-gold" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer-dark"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#daa520', 'rgba(0,0,0,0.8)')}
</body></html>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 4: Fresh Green
// ═══════════════════════════════════════════
export function templateFreshGreen(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#f1f8e9;color:#333;line-height:1.6}
.eco-bar{background:linear-gradient(90deg,#2e7d32,#43a047);color:#fff;text-align:center;padding:11px;font-size:14px;font-weight:600;position:sticky;top:0;z-index:100}
.img-wrap{margin:16px;border-radius:20px;overflow:hidden;background:#fff;box-shadow:0 4px 20px rgba(46,125,50,0.12)}
.img-wrap img{width:100%;height:auto;display:block}
.content{padding:20px 16px}
.leaf-badge{display:inline-flex;align-items:center;gap:4px;background:#e8f5e9;color:#2e7d32;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:600;margin-bottom:10px}
.content h1{font-size:24px;font-weight:800;color:#1b5e20;margin-bottom:8px}
.content .rating{color:#f5a623;font-size:16px;margin-bottom:12px}
.content .rating span{color:#888;font-size:13px}
.price-area{display:flex;align-items:baseline;gap:10px;margin-bottom:20px}
.price-area .old{text-decoration:line-through;color:#aaa;font-size:16px}
.price-area .current{font-size:32px;font-weight:800;color:#2e7d32}
.price-area .tag{background:#c8e6c9;color:#1b5e20;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:700}
.btn-green{display:block;width:100%;padding:16px;font-size:18px;font-weight:700;color:#fff;background:linear-gradient(135deg,#2e7d32,#43a047);border:none;border-radius:14px;cursor:pointer;margin-bottom:10px}
.btn-outline-green{display:block;width:100%;padding:14px;font-size:15px;font-weight:600;color:#2e7d32;background:#fff;border:2px solid #2e7d32;border-radius:14px;cursor:pointer;text-decoration:none;text-align:center}
.eco-features{padding:24px 16px}
.eco-features h2{text-align:center;font-size:20px;font-weight:800;color:#1b5e20;margin-bottom:16px}
.ef-card{background:#fff;border-radius:14px;padding:16px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.ef-icon{width:40px;height:40px;border-radius:10px;background:#e8f5e9;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.ef-text h4{font-size:15px;font-weight:700;color:#2e7d32;margin-bottom:2px}.ef-text p{font-size:13px;color:#666}
.eco-trust{display:flex;justify-content:space-around;padding:20px 16px;background:#fff;margin:16px;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.et-item{text-align:center}.et-item .ei{font-size:28px;display:block;margin-bottom:4px}.et-item span{font-size:11px;font-weight:600;color:#555}
.footer-green{text-align:center;padding:20px;color:#aaa;font-size:11px}
</style></head><body>
<div class="eco-bar">🌿 ${p.topBannerText}</div>
<div class="img-wrap"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="content">
  <span class="leaf-badge">🌿 ${p.subtitle}</span>
  <h1>${p.productName}</h1>
  <div class="rating">★★★★★ <span>${p.reviewText}</span></div>
  <div class="price-area"><span class="old">৳${p.originalPrice}</span><span class="current">৳${p.sellingPrice}</span><span class="tag">${p.discountPercent}% সেভ</span></div>
  ${tieredPricingSectionHtml(p, '#2e7d32')}
  <button class="btn-green" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-outline-green">📞 ${p.callButtonText}: ${p.phoneNumber}</a>
</div>
<div class="eco-trust">
  <div class="et-item"><span class="ei">🌱</span><span>${p.trustBadge1}</span></div>
  <div class="et-item"><span class="ei">🚚</span><span>${p.trustBadge2}</span></div>
  <div class="et-item"><span class="ei">🏅</span><span>${p.trustBadge3}</span></div>
  <div class="et-item"><span class="ei">💵</span><span>${p.trustBadge4}</span></div>
</div>
<div class="eco-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="ef-card"><div class="ef-icon">🌿</div><div class="ef-text"><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">⚡</div><div class="ef-text"><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">🔧</div><div class="ef-text"><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">✨</div><div class="ef-text"><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-green" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer-green"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#2e7d32')}
</body></html>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 5: Vibrant Gradient
// ═══════════════════════════════════════════
export function templateVibrantGradient(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#faf5ff;color:#333;line-height:1.6}
.vg-top{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;text-align:center;padding:12px;font-size:14px;font-weight:700;position:sticky;top:0;z-index:100}
.vg-timer{margin:16px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-radius:16px;padding:14px;text-align:center;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}
.vg-timer .num{background:rgba(255,255,255,0.25);padding:4px 14px;border-radius:50%;font-size:22px;font-weight:900}
.vg-hero{margin:0 16px;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#ede9fe,#fce7f3);padding:4px}
.vg-hero img{width:100%;border-radius:16px;display:block}
.vg-info{text-align:center;padding:20px 16px}
.vg-info h1{font-size:26px;font-weight:900;background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.vg-info .sub{color:#a855f7;font-size:16px;font-weight:700;margin-top:4px}
.vg-info .stars{margin:10px 0;font-size:18px;color:#f5a623}.vg-info .rev{color:#999;font-size:13px}
.vg-price{display:flex;align-items:baseline;justify-content:center;gap:10px;margin:12px 0}
.vg-price .old{text-decoration:line-through;color:#bbb;font-size:16px}
.vg-price .now{font-size:34px;font-weight:900;color:#7c3aed}
.vg-price .badge{background:linear-gradient(135deg,#ec4899,#f43f5e);color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700}
.btn-gradient{display:block;width:calc(100% - 32px);margin:0 16px 10px;padding:17px;font-size:19px;font-weight:800;color:#fff;background:linear-gradient(135deg,#7c3aed,#ec4899);border:none;border-radius:14px;cursor:pointer;text-align:center}
.btn-gradient-outline{display:block;width:calc(100% - 32px);margin:0 16px 16px;padding:14px;font-size:15px;font-weight:600;color:#7c3aed;background:#fff;border:2px solid #7c3aed;border-radius:14px;cursor:pointer;text-align:center;text-decoration:none}
.vg-badges{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:8px 16px 20px}
.vgb{background:#fff;border-radius:14px;padding:16px;text-align:center;box-shadow:0 2px 12px rgba(124,58,237,0.08)}
.vgb .icon{font-size:28px;margin-bottom:6px;display:block}.vgb span{font-size:13px;font-weight:600;color:#555}
.vg-features{padding:20px 16px}
.vg-features h2{text-align:center;font-size:20px;font-weight:900;color:#7c3aed;margin-bottom:16px}
.vgf{background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;box-shadow:0 2px 12px rgba(124,58,237,0.06);display:flex;gap:12px}
.vgf-dot{width:8px;border-radius:4px;background:linear-gradient(180deg,#7c3aed,#ec4899);flex-shrink:0}
.vgf h4{font-size:15px;font-weight:700;color:#7c3aed;margin-bottom:2px}.vgf p{font-size:13px;color:#888}
.vg-footer{text-align:center;padding:20px;color:#ccc;font-size:11px}
</style></head><body>
<div class="vg-top">✨ ${p.topBannerText} ✨</div>
<div class="vg-timer">${p.countdownText} <span class="num" id="countdown-num">49</span> জনের মধ্যে</div>
<div class="vg-hero"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="vg-info">
  <h1>${p.productName}</h1><div class="sub">${p.subtitle}</div>
  <div class="stars">⭐⭐⭐⭐⭐ <span class="rev">${p.reviewText}</span></div>
  <div class="vg-price"><span class="old">৳${p.originalPrice}</span><span class="now">৳${p.sellingPrice}</span><span class="badge">${p.discountPercent}% ছাড়</span></div>
</div>
${tieredPricingSectionHtml(p, '#7c3aed')}
<button class="btn-gradient" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
<a href="tel:${p.phoneNumber}" class="btn-gradient-outline">📞 ${p.callButtonText}: ${p.phoneNumber}</a>
<div class="vg-badges">
  <div class="vgb"><span class="icon">🛡️</span><span>${p.trustBadge1}</span></div>
  <div class="vgb"><span class="icon">⚡</span><span>${p.trustBadge2}</span></div>
  <div class="vgb"><span class="icon">🏆</span><span>${p.trustBadge3}</span></div>
  <div class="vgb"><span class="icon">💰</span><span>${p.trustBadge4}</span></div>
</div>
<div class="vg-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-gradient" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="vg-footer"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#7c3aed')}
${countdownScript()}
</body></html>`;
}

// ═══════════════════════════════════════════
// TEMPLATE 6: Minimal White
// ═══════════════════════════════════════════
export function templateMinimalWhite(p: TemplateConfig): string {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;background:#fff;color:#111;line-height:1.7}
.mw-notice{background:#111;color:#fff;text-align:center;padding:10px;font-size:13px;font-weight:500;position:sticky;top:0;z-index:100}
.mw-img{padding:24px 16px 0}
.mw-img img{width:100%;border-radius:8px;display:block}
.mw-content{padding:24px 20px}
.mw-content h1{font-size:28px;font-weight:700;letter-spacing:-.5px;margin-bottom:8px}
.mw-content .sub{color:#888;font-size:15px;margin-bottom:16px}
.mw-content .rating{font-size:14px;color:#888;margin-bottom:16px}.mw-content .rating .st{color:#111}
.mw-divider{height:1px;background:#eee;margin:16px 0}
.mw-price{display:flex;align-items:baseline;gap:12px;margin-bottom:24px}
.mw-price .old{text-decoration:line-through;color:#ccc;font-size:16px}
.mw-price .new{font-size:32px;font-weight:700;color:#111}
.mw-price .save{color:#e53935;font-size:14px;font-weight:600}
.btn-black{display:block;width:100%;padding:16px;font-size:16px;font-weight:600;color:#fff;background:#111;border:none;border-radius:8px;cursor:pointer;text-align:center;margin-bottom:10px;letter-spacing:.5px}
.btn-black:hover{background:#333}
.btn-outline-black{display:block;width:100%;padding:14px;font-size:14px;font-weight:600;color:#111;background:#fff;border:1.5px solid #ddd;border-radius:8px;cursor:pointer;text-align:center;text-decoration:none}
.mw-features{padding:32px 20px}
.mw-features h2{font-size:20px;font-weight:700;margin-bottom:20px;letter-spacing:-.3px}
.mwf{padding:16px 0;border-bottom:1px solid #f0f0f0;display:flex;gap:14px}
.mwf:last-child{border-bottom:none}
.mwf-num{width:32px;height:32px;border-radius:50%;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;color:#111;flex-shrink:0}
.mwf h4{font-size:15px;font-weight:600;margin-bottom:2px}.mwf p{font-size:13px;color:#888}
.mw-trust{display:flex;justify-content:space-between;padding:20px;margin:0 20px;border:1px solid #eee;border-radius:8px}
.mt-item{text-align:center;flex:1}.mt-item .mi{font-size:20px;display:block;margin-bottom:4px}.mt-item span{font-size:10px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px}
.mw-footer{text-align:center;padding:32px 20px;color:#ccc;font-size:11px}
</style></head><body>
<div class="mw-notice">${p.topBannerText}</div>
<div class="mw-img"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="mw-content">
  <h1>${p.productName}</h1>
  <div class="sub">${p.subtitle}</div>
  <div class="rating"><span class="st">★★★★★</span> ${p.reviewText}</div>
  <div class="mw-divider"></div>
  <div class="mw-price"><span class="old">৳${p.originalPrice}</span><span class="new">৳${p.sellingPrice}</span><span class="save">-${p.discountPercent}%</span></div>
  ${tieredPricingSectionHtml(p, '#111')}
  <button class="btn-black" onclick="openCheckout()">${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-outline-black">${p.callButtonText} — ${p.phoneNumber}</a>
</div>
<div class="mw-trust">
  <div class="mt-item"><span class="mi">✓</span><span>${p.trustBadge1}</span></div>
  <div class="mt-item"><span class="mi">⚡</span><span>${p.trustBadge2}</span></div>
  <div class="mt-item"><span class="mi">🏅</span><span>${p.trustBadge3}</span></div>
  <div class="mt-item"><span class="mi">💵</span><span>${p.trustBadge4}</span></div>
</div>
<div class="mw-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="mwf"><div class="mwf-num">01</div><div><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">02</div><div><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">03</div><div><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">04</div><div><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 20px 24px"><button class="btn-black" onclick="openCheckout()">এখনই ${p.ctaButtonText}</button></div>
<div class="mw-footer"><p>${p.footerText}</p></div>
${checkoutPopupHtml(p, '#111')}
</body></html>`;
}

// Map template ID to generator function
export function generateTemplate(templateId: string, config: TemplateConfig): string {
  const generators: Record<string, (p: TemplateConfig) => string> = {
    "classic-orange": templateClassicOrange,
    "modern-blue": templateModernBlue,
    "elegant-dark": templateElegantDark,
    "fresh-green": templateFreshGreen,
    "vibrant-gradient": templateVibrantGradient,
    "minimal-white": templateMinimalWhite,
  };
  const gen = generators[templateId];
  if (!gen) return templateClassicOrange(config);
  return gen(config);
}

// Keep backward compat
export function getProductLandingTemplate(opts?: Partial<TemplateConfig>): string {
  return templateClassicOrange({ ...defaultTemplateConfig, ...opts });
}
