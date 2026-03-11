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

// Shared checkout popup HTML
function checkoutPopupHtml(p: TemplateConfig, accentColor: string, bgOverlay: string = "rgba(0,0,0,0.6)") {
  return `
<!-- Checkout Popup -->
<div class="checkout-overlay" id="checkoutOverlay" style="display:none;position:fixed;inset:0;background:${bgOverlay};z-index:9999;align-items:flex-end;justify-content:center">
  <div style="background:#fff;width:100%;max-width:500px;border-radius:20px 20px 0 0;padding:24px 20px 32px;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease">
    <div style="position:relative;margin-bottom:8px">
      <button onclick="closeCheckout()" style="position:absolute;top:0;right:0;font-size:24px;background:none;border:none;cursor:pointer;color:#999">✕</button>
      <h2 style="font-size:20px;font-weight:800;color:#111;text-align:center;margin:0 0 4px">🛒 ${p.ctaButtonText}</h2>
      <p style="text-align:center;color:#888;font-size:13px;margin:0 0 20px">${p.productName} - ৳${p.sellingPrice}</p>
    </div>
    <form data-checkout-form data-product-name="${p.productName}" data-product-code="${p.productCode}" data-unit-price="${p.sellingPrice.replace(/[৳,\s]/g,'')}" data-delivery-charge="${p.deliveryCharge}" id="checkoutForm">
      <div id="formFields">
        <div style="margin-bottom:14px"><label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:5px">আপনার নাম *</label><input type="text" name="customer_name" placeholder="আপনার পুরো নাম লিখুন" required style="width:100%;padding:13px 14px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none" onfocus="this.style.borderColor='${accentColor}'" onblur="this.style.borderColor='#e0e0e0'" /></div>
        <div style="margin-bottom:14px"><label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:5px">মোবাইল নম্বর *</label><input type="tel" name="customer_phone" placeholder="01XXXXXXXXX" required style="width:100%;padding:13px 14px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none" onfocus="this.style.borderColor='${accentColor}'" onblur="this.style.borderColor='#e0e0e0'" /></div>
        <div style="margin-bottom:14px"><label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:5px">সম্পূর্ণ ঠিকানা *</label><textarea name="customer_address" placeholder="বাসা, রাস্তা, এলাকা, জেলা" required style="width:100%;padding:13px 14px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none;resize:vertical;min-height:60px" onfocus="this.style.borderColor='${accentColor}'" onblur="this.style.borderColor='#e0e0e0'"></textarea></div>
        <div style="margin-bottom:14px"><label style="display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:5px">পরিমাণ</label><select name="quantity" id="qtySelect" onchange="updateSummary()" style="width:100%;padding:13px 14px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none"><option value="1">১ পিস</option><option value="2">২ পিস</option><option value="3">৩ পিস</option></select></div>
        <div style="background:#f5f5f0;border-radius:12px;padding:14px;margin:16px 0">
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0"><span>প্রোডাক্ট মূল্য:</span><span id="sumProduct">৳${p.sellingPrice}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0"><span>ডেলিভারি চার্জ:</span><span>৳${p.deliveryCharge}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;border-top:1px solid #ddd;margin-top:6px;padding-top:8px"><span>সর্বমোট:</span><span id="sumTotal">৳${(parseInt(p.sellingPrice.replace(/[^\d]/g,''))||0) + (parseInt(p.deliveryCharge)||0)}</span></div>
        </div>
        <button type="submit" id="submitBtn" style="width:100%;padding:16px;font-size:18px;font-weight:700;color:#fff;background:${accentColor};border:none;border-radius:12px;cursor:pointer">✅ অর্ডার কনফার্ম করুন</button>
      </div>
      <div id="successMsg" style="display:none;text-align:center;padding:40px 20px"><div style="font-size:60px;color:#4caf50;margin-bottom:12px">✅</div><h3 style="font-size:22px;font-weight:800;color:#111;margin:0 0 8px">অর্ডার সফল হয়েছে!</h3><p style="color:#666;font-size:14px;margin:0">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p></div>
    </form>
  </div>
</div>
<style>@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}</style>
<script>
function openCheckout(){document.getElementById('checkoutOverlay').style.display='flex';document.getElementById('checkoutOverlay').style.alignItems='flex-end';document.getElementById('checkoutOverlay').style.justifyContent='center';document.body.style.overflow='hidden'}
function closeCheckout(){document.getElementById('checkoutOverlay').style.display='none';document.body.style.overflow=''}
document.getElementById('checkoutOverlay').addEventListener('click',function(e){if(e.target===this)closeCheckout()});
var unitPrice=${p.sellingPrice.replace(/[^\d]/g,'')||0},deliveryCharge=${p.deliveryCharge||0};
function updateSummary(){var q=parseInt(document.getElementById('qtySelect').value)||1;document.getElementById('sumProduct').textContent='৳'+(unitPrice*q);document.getElementById('sumTotal').textContent='৳'+(unitPrice*q+deliveryCharge)}
</script>`;
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
<div class="countdown-bar">অফারটি পাবে আর মাত্র <span class="count-num" id="countdown-num">69</span> জন</div>
<div class="product-hero"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="product-info">
  <h1>${p.productName}</h1><div class="subtitle">${p.subtitle}</div>
  <div class="stars">⭐⭐⭐⭐⭐ <span class="reviews">(150+ Reviews)</span></div>
  <div class="price-row"><span class="price-old">৳${p.originalPrice}</span><span class="price-new">৳ ${p.sellingPrice}</span><span class="discount-badge">${p.discountPercent}% ছাড়</span></div>
</div>
<div class="cta-section">
  <button class="btn-order" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-call">📞 অর্ডার করতে কল করুন: ${p.phoneNumber}</a>
</div>
<div class="trust-grid">
  <div class="trust-card"><div class="icon">🛡️</div><p>১০০% অরিজিনাল</p></div>
  <div class="trust-card"><div class="icon">🚚</div><p>দ্রুত ডেলিভারি</p></div>
  <div class="trust-card"><div class="icon">🏅</div><p>প্রিমিয়াম কোয়ালিটি</p></div>
  <div class="trust-card"><div class="icon">📞</div><p>ক্যাশ অন ডেলিভারি</p></div>
</div>
<div class="features-section">
  <h2>${p.whySectionTitle}</h2>
  <div class="feature-card"><h3>✅ ${p.feature1Title}</h3><p>${p.feature1Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature2Title}</h3><p>${p.feature2Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature3Title}</h3><p>${p.feature3Desc}</p></div>
  <div class="feature-card"><h3>✅ ${p.feature4Title}</h3><p>${p.feature4Desc}</p></div>
</div>
<div class="cta-section"><button class="btn-order" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="lp-footer"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
    <div class="rating"><span class="stars">★★★★★</span><span class="count">(200+ Reviews)</span></div>
    <div class="price-box"><span class="old">৳${p.originalPrice}</span><span class="new">৳${p.sellingPrice}</span><span class="save">${p.discountPercent}% OFF</span></div>
    <button class="btn-primary" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
    <a href="tel:${p.phoneNumber}" class="btn-secondary">📞 কল করুন: ${p.phoneNumber}</a>
  </div>
</div>
<div class="badges">
  <div class="badge-item"><span class="bi">✓</span><span>অরিজিনাল</span></div>
  <div class="badge-item"><span class="bi">🚀</span><span>ফাস্ট শিপ</span></div>
  <div class="badge-item"><span class="bi">🏅</span><span>প্রিমিয়াম</span></div>
  <div class="badge-item"><span class="bi">💵</span><span>COD</span></div>
</div>
<div class="why-section">
  <h2>${p.whySectionTitle}</h2>
  <div class="why-card"><h4>💎 ${p.feature1Title}</h4><p>${p.feature1Desc}</p></div>
  <div class="why-card"><h4>⚡ ${p.feature2Title}</h4><p>${p.feature2Desc}</p></div>
  <div class="why-card"><h4>🔧 ${p.feature3Title}</h4><p>${p.feature3Desc}</p></div>
  <div class="why-card"><h4>✨ ${p.feature4Title}</h4><p>${p.feature4Desc}</p></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-primary" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
  <div class="stars">★★★★★ <span style="color:#888;font-size:13px">(120+ Reviews)</span></div>
  <div class="price-display"><span class="was">৳${p.originalPrice}</span><span class="now">৳${p.sellingPrice}</span><span class="off">${p.discountPercent}% OFF</span></div>
</div>
<button class="btn-gold" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
<a href="tel:${p.phoneNumber}" class="btn-dark-call">📞 কল করুন: ${p.phoneNumber}</a>
<div class="dark-badges">
  <div class="db-item"><span class="di">🛡️</span><span>অরিজিনাল গ্যারান্টি</span></div>
  <div class="db-item"><span class="di">🚚</span><span>দ্রুত ডেলিভারি</span></div>
  <div class="db-item"><span class="di">💎</span><span>প্রিমিয়াম কোয়ালিটি</span></div>
  <div class="db-item"><span class="di">💰</span><span>ক্যাশ অন ডেলিভারি</span></div>
</div>
<div class="features-dark">
  <h2>${p.whySectionTitle}</h2>
  <div class="fd-card"><h4>✦ ${p.feature1Title}</h4><p>${p.feature1Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature2Title}</h4><p>${p.feature2Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature3Title}</h4><p>${p.feature3Desc}</p></div>
  <div class="fd-card"><h4>✦ ${p.feature4Title}</h4><p>${p.feature4Desc}</p></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-gold" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer-dark"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
  <div class="rating">★★★★★ <span>(180+ Reviews)</span></div>
  <div class="price-area"><span class="old">৳${p.originalPrice}</span><span class="current">৳${p.sellingPrice}</span><span class="tag">${p.discountPercent}% সেভ</span></div>
  <button class="btn-green" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-outline-green">📞 কল: ${p.phoneNumber}</a>
</div>
<div class="eco-trust">
  <div class="et-item"><span class="ei">🌱</span><span>অরিজিনাল</span></div>
  <div class="et-item"><span class="ei">🚚</span><span>ফ্রি শিপিং</span></div>
  <div class="et-item"><span class="ei">🏅</span><span>টপ কোয়ালিটি</span></div>
  <div class="et-item"><span class="ei">💵</span><span>COD</span></div>
</div>
<div class="eco-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="ef-card"><div class="ef-icon">🌿</div><div class="ef-text"><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">⚡</div><div class="ef-text"><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">🔧</div><div class="ef-text"><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="ef-card"><div class="ef-icon">✨</div><div class="ef-text"><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-green" onclick="openCheckout()">🛒 এখনই ${p.ctaButtonText}</button></div>
<div class="footer-green"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
<div class="vg-timer">অফার শেষ হবে <span class="num" id="countdown-num">49</span> জনের মধ্যে</div>
<div class="vg-hero"><img src="${p.imageUrl}" alt="${p.productName}"/></div>
<div class="vg-info">
  <h1>${p.productName}</h1><div class="sub">${p.subtitle}</div>
  <div class="stars">⭐⭐⭐⭐⭐ <span class="rev">(250+ Reviews)</span></div>
  <div class="vg-price"><span class="old">৳${p.originalPrice}</span><span class="now">৳${p.sellingPrice}</span><span class="badge">${p.discountPercent}% ছাড়</span></div>
</div>
<button class="btn-gradient" onclick="openCheckout()">🛒 ${p.ctaButtonText}</button>
<a href="tel:${p.phoneNumber}" class="btn-gradient-outline">📞 কল করুন: ${p.phoneNumber}</a>
<div class="vg-badges">
  <div class="vgb"><span class="icon">🛡️</span><span>১০০% অথেনটিক</span></div>
  <div class="vgb"><span class="icon">⚡</span><span>এক্সপ্রেস ডেলিভারি</span></div>
  <div class="vgb"><span class="icon">🏆</span><span>বেস্ট সেলার</span></div>
  <div class="vgb"><span class="icon">💰</span><span>ক্যাশ অন ডেলিভারি</span></div>
</div>
<div class="vg-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="vgf"><div class="vgf-dot"></div><div><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 16px 20px"><button class="btn-gradient" onclick="openCheckout()">🛒 এখনই অর্ডার করুন</button></div>
<div class="vg-footer"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
  <div class="rating"><span class="st">★★★★★</span> 4.8/5 · 200+ রিভিউ</div>
  <div class="mw-divider"></div>
  <div class="mw-price"><span class="old">৳${p.originalPrice}</span><span class="new">৳${p.sellingPrice}</span><span class="save">-${p.discountPercent}%</span></div>
  <button class="btn-black" onclick="openCheckout()">${p.ctaButtonText}</button>
  <a href="tel:${p.phoneNumber}" class="btn-outline-black">কল করুন — ${p.phoneNumber}</a>
</div>
<div class="mw-trust">
  <div class="mt-item"><span class="mi">✓</span><span>অরিজিনাল</span></div>
  <div class="mt-item"><span class="mi">⚡</span><span>ফাস্ট</span></div>
  <div class="mt-item"><span class="mi">🏅</span><span>প্রিমিয়াম</span></div>
  <div class="mt-item"><span class="mi">💵</span><span>COD</span></div>
</div>
<div class="mw-features">
  <h2>${p.whySectionTitle}</h2>
  <div class="mwf"><div class="mwf-num">01</div><div><h4>${p.feature1Title}</h4><p>${p.feature1Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">02</div><div><h4>${p.feature2Title}</h4><p>${p.feature2Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">03</div><div><h4>${p.feature3Title}</h4><p>${p.feature3Desc}</p></div></div>
  <div class="mwf"><div class="mwf-num">04</div><div><h4>${p.feature4Title}</h4><p>${p.feature4Desc}</p></div></div>
</div>
<div style="padding:0 20px 24px"><button class="btn-black" onclick="openCheckout()">এখনই ${p.ctaButtonText}</button></div>
<div class="mw-footer"><p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p></div>
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
