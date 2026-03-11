// Pre-built landing page HTML templates

export function getProductLandingTemplate(opts?: {
  productName?: string;
  subtitle?: string;
  originalPrice?: string;
  sellingPrice?: string;
  discountPercent?: string;
  deliveryCharge?: string;
  productCode?: string;
  phoneNumber?: string;
  imageUrl?: string;
}): string {
  const p = {
    productName: opts?.productName || "আপনার প্রোডাক্ট নাম",
    subtitle: opts?.subtitle || "(বড় সাইজ)",
    originalPrice: opts?.originalPrice || "৯৯০",
    sellingPrice: opts?.sellingPrice || "৬৯০",
    discountPercent: opts?.discountPercent || "৩০",
    deliveryCharge: opts?.deliveryCharge || "60",
    productCode: opts?.productCode || "SKU001",
    phoneNumber: opts?.phoneNumber || "01XXXXXXXXX",
    imageUrl: opts?.imageUrl || "https://placehold.co/600x600/f5f5f0/333?text=Product+Image",
  };

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${p.productName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#fff;color:#333;line-height:1.6}

/* Top Banner */
.top-banner{background:linear-gradient(135deg,#ff6b00,#ff9800);color:#fff;text-align:center;padding:12px 16px;font-size:15px;font-weight:600;position:sticky;top:0;z-index:100}

/* Countdown */
.countdown-bar{background:linear-gradient(135deg,#e91e63,#ff5722);color:#fff;text-align:center;padding:14px 16px;font-size:16px;border-radius:12px;margin:16px;display:flex;align-items:center;justify-content:center;gap:8px}
.countdown-bar .count-num{background:rgba(255,255,255,0.3);padding:4px 14px;border-radius:50%;font-size:22px;font-weight:800}

/* Product Image */
.product-hero{margin:0 16px;border-radius:16px;overflow:hidden;border:1px solid #eee;background:#fafaf5}
.product-hero img{width:100%;height:auto;display:block;object-fit:cover}

/* Title & Price */
.product-info{text-align:center;padding:24px 16px 8px}
.product-info h1{font-size:26px;font-weight:800;color:#111}
.product-info .subtitle{color:#ff6b00;font-size:18px;font-weight:700;margin-top:2px}
.product-info .stars{margin:12px 0 8px;font-size:20px;color:#f5a623}
.product-info .reviews{color:#888;font-size:14px}
.price-row{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px;flex-wrap:wrap}
.price-old{text-decoration:line-through;color:#999;font-size:18px}
.price-new{font-size:32px;font-weight:800;color:#111}
.discount-badge{background:#ff1744;color:#fff;padding:4px 14px;border-radius:20px;font-size:14px;font-weight:700}

/* CTA Buttons */
.cta-section{padding:20px 16px}
.btn-order{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px;font-size:20px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff6b00,#ff9800);border:none;border-radius:12px;cursor:pointer;margin-bottom:12px;text-decoration:none}
.btn-order:hover{opacity:0.92}
.btn-call{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:16px;font-size:17px;font-weight:700;color:#fff;background:#2e7d32;border:none;border-radius:12px;cursor:pointer;text-decoration:none}
.btn-call:hover{opacity:0.92}

/* Trust Badges */
.trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:24px 16px}
.trust-card{background:#f5f5f0;border-radius:14px;padding:20px 12px;text-align:center}
.trust-card .icon{font-size:32px;margin-bottom:8px;color:#2e7d32}
.trust-card p{font-size:14px;font-weight:600;color:#333}

/* Features Section */
.features-section{padding:32px 16px}
.features-section h2{text-align:center;font-size:22px;font-weight:800;color:#111;margin-bottom:20px}
.feature-card{background:#fafaf5;border:1px solid #eee;border-radius:14px;padding:20px;margin-bottom:14px}
.feature-card h3{color:#ff6b00;font-size:17px;font-weight:700;margin-bottom:6px}
.feature-card h3 .check{color:#4caf50;margin-right:6px}
.feature-card p{color:#666;font-size:14px;line-height:1.6}

/* Checkout Popup */
.checkout-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;align-items:flex-end;justify-content:center}
.checkout-overlay.active{display:flex}
.checkout-popup{background:#fff;width:100%;max-width:500px;border-radius:20px 20px 0 0;padding:24px 20px 32px;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.checkout-popup h2{font-size:20px;font-weight:800;color:#111;text-align:center;margin-bottom:4px}
.checkout-popup .popup-subtitle{text-align:center;color:#888;font-size:13px;margin-bottom:20px}
.checkout-popup .close-btn{position:absolute;top:12px;right:16px;font-size:24px;background:none;border:none;cursor:pointer;color:#999}
.popup-header{position:relative;margin-bottom:8px}
.form-group{margin-bottom:14px}
.form-group label{display:block;font-size:13px;font-weight:600;color:#555;margin-bottom:5px}
.form-group input,.form-group textarea,.form-group select{width:100%;padding:13px 14px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none;transition:border .2s}
.form-group input:focus,.form-group textarea:focus,.form-group select:focus{border-color:#ff6b00}
.form-group textarea{resize:vertical;min-height:60px}
.order-summary{background:#f5f5f0;border-radius:12px;padding:14px;margin:16px 0}
.order-summary .row{display:flex;justify-content:space-between;font-size:14px;padding:4px 0}
.order-summary .row.total{font-weight:800;font-size:16px;border-top:1px solid #ddd;margin-top:6px;padding-top:8px}
.btn-submit{width:100%;padding:16px;font-size:18px;font-weight:700;color:#fff;background:linear-gradient(135deg,#ff6b00,#ff9800);border:none;border-radius:12px;cursor:pointer}
.btn-submit:hover{opacity:0.92}
.btn-submit:disabled{opacity:0.6;cursor:not-allowed}

/* Success Message */
.success-msg{display:none;text-align:center;padding:40px 20px}
.success-msg.active{display:block}
.success-msg .check-icon{font-size:60px;color:#4caf50;margin-bottom:12px}
.success-msg h3{font-size:22px;font-weight:800;color:#111;margin-bottom:8px}
.success-msg p{color:#666;font-size:14px}

/* Footer */
.lp-footer{background:#f5f5f0;padding:24px 16px;text-align:center;margin-top:32px}
.lp-footer p{color:#999;font-size:12px}
</style>
</head>
<body>

<!-- Top Banner -->
<div class="top-banner">🎉 সীমিত সময়ের অফার - এখনই অর্ডার করুন! 🎉</div>

<!-- Countdown -->
<div class="countdown-bar">
  অফারটি পাবে আর মাত্র <span class="count-num" id="countdown-num">69</span> জন
</div>

<!-- Product Image -->
<div class="product-hero">
  <img src="${p.imageUrl}" alt="${p.productName}" id="product-main-image" />
</div>

<!-- Product Info -->
<div class="product-info">
  <h1>${p.productName}</h1>
  <div class="subtitle">${p.subtitle}</div>
  <div class="stars">⭐⭐⭐⭐⭐ <span class="reviews">(150+ Reviews)</span></div>
  <div class="price-row">
    <span class="price-old">৳${p.originalPrice}</span>
    <span class="price-new">৳ ${p.sellingPrice}</span>
    <span class="discount-badge">${p.discountPercent}% ছাড়</span>
  </div>
</div>

<!-- CTA Buttons -->
<div class="cta-section">
  <button class="btn-order" onclick="openCheckout()">🛒 অর্ডার করুন</button>
  <a href="tel:${p.phoneNumber}" class="btn-call">📞 অর্ডার করতে কল করুন: ${p.phoneNumber}</a>
</div>

<!-- Trust Badges -->
<div class="trust-grid">
  <div class="trust-card"><div class="icon">🛡️</div><p>১০০% অরিজিনাল</p></div>
  <div class="trust-card"><div class="icon">🚚</div><p>দ্রুত ডেলিভারি</p></div>
  <div class="trust-card"><div class="icon">🏅</div><p>প্রিমিয়াম কোয়ালিটি</p></div>
  <div class="trust-card"><div class="icon">📞</div><p>ক্যাশ অন ডেলিভারি</p></div>
</div>

<!-- Features -->
<div class="features-section">
  <h2>কেন এই প্রোডাক্ট বেছে নেবেন?</h2>
  <div class="feature-card">
    <h3><span class="check">✅</span> প্রিমিয়াম কোয়ালিটি</h3>
    <p>উচ্চমানের উপকরণ দিয়ে তৈরি, যা দীর্ঘদিন টেকসই এবং ব্যবহারে আরামদায়ক।</p>
  </div>
  <div class="feature-card">
    <h3><span class="check">✅</span> সহজ ব্যবহার</h3>
    <p>যেকোনো মানুষ সহজেই ব্যবহার করতে পারবেন - কোনো ঝামেলা নেই।</p>
  </div>
  <div class="feature-card">
    <h3><span class="check">✅</span> বড় সাইজ</h3>
    <p>বড় আকারের এবং সবকিছুর জন্য উপযুক্ত।</p>
  </div>
  <div class="feature-card">
    <h3><span class="check">✅</span> সহজে পরিষ্কার</h3>
    <p>ব্যবহারের পর পানি দিয়ে ধুয়ে নিন - কোনো ঝামেলা নেই!</p>
  </div>
</div>

<!-- Another CTA -->
<div class="cta-section">
  <button class="btn-order" onclick="openCheckout()">🛒 এখনই অর্ডার করুন</button>
</div>

<!-- Footer -->
<div class="lp-footer">
  <p>© ${new Date().getFullYear()} সর্বস্বত্ব সংরক্ষিত</p>
</div>

<!-- Checkout Popup -->
<div class="checkout-overlay" id="checkoutOverlay">
  <div class="checkout-popup">
    <div class="popup-header">
      <button class="close-btn" onclick="closeCheckout()">✕</button>
      <h2>🛒 অর্ডার করুন</h2>
      <p class="popup-subtitle">${p.productName} - ৳${p.sellingPrice}</p>
    </div>

    <form
      data-checkout-form
      data-product-name="${p.productName}"
      data-product-code="${p.productCode}"
      data-unit-price="${p.sellingPrice.replace(/[৳,\s]/g, '')}"
      data-delivery-charge="${p.deliveryCharge}"
      id="checkoutForm"
    >
      <div id="formFields">
        <div class="form-group">
          <label>আপনার নাম *</label>
          <input type="text" name="customer_name" placeholder="আপনার পুরো নাম লিখুন" required />
        </div>
        <div class="form-group">
          <label>মোবাইল নম্বর *</label>
          <input type="tel" name="customer_phone" placeholder="01XXXXXXXXX" required />
        </div>
        <div class="form-group">
          <label>সম্পূর্ণ ঠিকানা *</label>
          <textarea name="customer_address" placeholder="বাসা, রাস্তা, এলাকা, জেলা" required></textarea>
        </div>
        <div class="form-group">
          <label>পরিমাণ</label>
          <select name="quantity" id="qtySelect" onchange="updateSummary()">
            <option value="1">১ পিস</option>
            <option value="2">২ পিস</option>
            <option value="3">৩ পিস</option>
          </select>
        </div>

        <div class="order-summary" id="orderSummary">
          <div class="row"><span>প্রোডাক্ট মূল্য:</span><span id="sumProduct">৳${p.sellingPrice}</span></div>
          <div class="row"><span>ডেলিভারি চার্জ:</span><span>৳${p.deliveryCharge}</span></div>
          <div class="row total"><span>সর্বমোট:</span><span id="sumTotal">৳${(parseInt(p.sellingPrice.replace(/[^\d]/g, '')) + parseInt(p.deliveryCharge)).toLocaleString('bn-BD')}</span></div>
        </div>

        <button type="submit" class="btn-submit" id="submitBtn">✅ অর্ডার কনফার্ম করুন</button>
      </div>

      <div class="success-msg" id="successMsg">
        <div class="check-icon">✅</div>
        <h3>অর্ডার সফল হয়েছে!</h3>
        <p>আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
      </div>
    </form>
  </div>
</div>

<script>
// Countdown
var countEl = document.getElementById('countdown-num');
if (countEl) {
  var c = parseInt(countEl.textContent) || 69;
  setInterval(function(){
    if (c > 10) { c--; countEl.textContent = c; }
  }, Math.random() * 30000 + 15000);
}

// Popup
function openCheckout() {
  document.getElementById('checkoutOverlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('active');
  document.body.style.overflow = '';
}
document.getElementById('checkoutOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeCheckout();
});

// Update summary
var unitPrice = ${p.sellingPrice.replace(/[^\d]/g, '')};
var deliveryCharge = ${p.deliveryCharge};
function updateSummary() {
  var qty = parseInt(document.getElementById('qtySelect').value) || 1;
  var productTotal = unitPrice * qty;
  var total = productTotal + deliveryCharge;
  document.getElementById('sumProduct').textContent = '৳' + productTotal;
  document.getElementById('sumTotal').textContent = '৳' + total;
}
</script>

</body>
</html>`;
}
