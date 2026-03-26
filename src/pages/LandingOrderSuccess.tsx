import { useParams, useSearchParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useLayoutEffect, useRef } from "react";

export default function LandingOrderSuccess() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const { data: page } = useLandingPageBySlug(slug || "");
  const renderedRef = useRef(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  const orderNumber = searchParams.get("order_number") || "";
  const value = searchParams.get("value") || "0";
  const currency = searchParams.get("currency") || "BDT";
  const contentName = searchParams.get("content_name") || "";
  const contentId = searchParams.get("content_id") || "";
  const numItems = searchParams.get("num_items") || "1";
  const eventId = searchParams.get("event_id") || "";
  const customerPhone = searchParams.get("phone") || "";
  const customerName = searchParams.get("name") || "";

  useLayoutEffect(() => {
    if (!page || renderedRef.current) return;
    renderedRef.current = true;

    const pixelId = page.fb_pixel_id || "";
    const tiktokPixelId = (page as any).tiktok_pixel_id || "";
    const gtmId = (page as any).gtm_id || "";

    // Build a full HTML page with pixel init + Purchase fire
    const html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>অর্ডার সফল - ${page.title || ''}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0fdf4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{width:100%;max-width:420px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.12);animation:zoomIn .4s ease}
@keyframes zoomIn{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
.header{background:linear-gradient(135deg,#10b981,#059669);padding:36px 24px;text-align:center}
.check{width:80px;height:80px;margin:0 auto 16px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;animation:pop .5s ease .2s both}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
.header h1{color:#fff;font-size:24px;font-weight:800}
.header p{color:rgba(255,255,255,.8);font-size:14px;margin-top:4px}
.body{padding:28px 24px;text-align:center}
.order-num-label{color:#6b7280;font-size:13px;margin-bottom:4px}
.order-num{font-size:36px;font-weight:900;color:#10b981;margin-bottom:20px}
.info-box{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px;margin-bottom:24px}
.info-box p{font-size:14px;color:#166534;line-height:1.5}
.details{text-align:left;background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px}
.details .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid #f3f4f6}
.details .row:last-child{border-bottom:none}
.details .label{color:#6b7280}
.details .val{font-weight:700;color:#111}
.btn{display:block;width:100%;padding:16px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:14px;font-size:17px;font-weight:700;cursor:pointer;text-decoration:none;text-align:center;transition:transform .15s}
.btn:hover{transform:scale(1.02)}
.btn:active{transform:scale(.98)}
.trust{display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap}
.trust span{font-size:12px;color:#9ca3af;display:flex;align-items:center;gap:4px}
</style>
${pixelId ? `
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;t.onload=function(){
  window.__fbSdkReady=true;
  if(window.__pendingPurchase){
    window.__pendingPurchase();
    window.__pendingPurchase=null;
  }
};s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

var _initParams = { country: 'bd' };
var _extId = '';
try { _extId = localStorage.getItem('_vid') || ''; } catch(e) {}
if (_extId) _initParams.external_id = _extId;
${customerPhone ? `_initParams.ph = '${customerPhone.replace(/[^0-9]/g, '')}';` : ''}
${customerName ? `(function(){
  var parts = '${customerName}'.trim().split(/\\s+/);
  _initParams.fn = (parts[0]||'').toLowerCase();
  _initParams.ln = (parts.slice(1).join(' ')||'').toLowerCase();
})();` : ''}

fbq('init', '${pixelId}', _initParams);
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/></noscript>
` : ''}
${tiktokPixelId ? `
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
ttq.load('${tiktokPixelId}');
ttq.page();
}(window,document,'ttq');
</script>
` : ''}
${gtmId ? `
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');</script>
` : ''}
</head>
<body>
<div class="card">
  <div class="header">
    <div class="check">✓</div>
    <h1>অর্ডার সফল হয়েছে!</h1>
    <p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে</p>
  </div>
  <div class="body">
    ${orderNumber ? `<p class="order-num-label">অর্ডার নম্বর</p><p class="order-num">#${orderNumber}</p>` : ''}
    <div class="info-box">
      <p>📞 আপনার অর্ডারটি কনফার্ম করতে শীঘ্রই কল করা হবে।</p>
    </div>
    ${contentName ? `<div class="details">
      <div class="row"><span class="label">প্রোডাক্ট</span><span class="val">${contentName.substring(0, 60)}</span></div>
      <div class="row"><span class="label">পরিমাণ</span><span class="val">${numItems} পিস</span></div>
      <div class="row"><span class="label">মূল্য</span><span class="val">৳${value}</span></div>
    </div>` : ''}
    <a href="/lp/${slug}" class="btn">🏠 হোমে ফিরে যান</a>
    <div class="trust">
      <span>🔒 নিরাপদ অর্ডার</span>
      <span>🚚 দ্রুত ডেলিভারি</span>
      <span>💯 গ্যারান্টি</span>
    </div>
  </div>
</div>

<!-- Purchase Event Fire -->
<script>
(function(){
  var purchaseParams = {
    value: ${parseFloat(value) || 0},
    currency: '${currency}',
    content_name: '${contentName.replace(/'/g, "\\'")}',
    content_ids: ${contentId ? `['${contentId}']` : '[]'},
    contents: ${contentId ? `[{id:'${contentId}',quantity:${parseInt(numItems) || 1},item_price:${(parseFloat(value) || 0) / (parseInt(numItems) || 1)}}]` : '[]'},
    content_type: 'product',
    content_category: 'ecommerce',
    num_items: ${parseInt(numItems) || 1},
    order_id: '${orderNumber}'
  };
  var eventId = '${eventId}';

  function firePurchase() {
    if (window.__purchaseFired) return;
    window.__purchaseFired = true;

    // Facebook Pixel Purchase
    if (typeof fbq === 'function' && typeof fbq.callMethod === 'function') {
      fbq('track', 'Purchase', purchaseParams, { eventID: eventId });
      console.log('[FB Pixel] Purchase fired on success page', purchaseParams, eventId);
    } else {
      console.warn('[FB Pixel] SDK not ready for Purchase, will retry');
      window.__purchaseFired = false;
      return false;
    }

    // TikTok
    if (typeof ttq !== 'undefined' && ttq.track) {
      ttq.track('CompletePayment', { value: purchaseParams.value, currency: purchaseParams.currency, content_name: purchaseParams.content_name, quantity: purchaseParams.num_items });
    }

    // GTM dataLayer
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({ event: 'conversion_Purchase', value: purchaseParams.value, currency: purchaseParams.currency, order_id: purchaseParams.order_id });
    }

    return true;
  }

  // Server-side CAPI Purchase
  var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
  var ANON = '${anonKey}';
  var extId = '';
  try { extId = localStorage.getItem('_vid') || ''; } catch(e) {}
  
  // Check if CAPI was already sent by the order endpoint
  var capiSent = '${searchParams.get("capi_sent") || ''}';
  if (!capiSent && '${page?.fb_pixel_id || ''}') {
    var normalizedPhone = '${customerPhone}'.replace(/[^0-9]/g, '');
    if (normalizedPhone.indexOf('0') === 0) normalizedPhone = '880' + normalizedPhone.substring(1);
    var nameParts = '${customerName}'.trim().split(/\\s+/);

    fetch(CAPI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON },
      body: JSON.stringify({
        pixel_id: '${page?.fb_pixel_id || ''}',
        event_name: 'Purchase',
        event_id: eventId,
        event_url: window.location.href,
        user_agent: navigator.userAgent,
        fbp: (function(){ var v = document.cookie.match('(^|;) ?_fbp=([^;]*)(;|$)'); return v ? decodeURIComponent(v[2]) : ''; })(),
        fbc: (function(){ var v = document.cookie.match('(^|;) ?_fbc=([^;]*)(;|$)'); return v ? decodeURIComponent(v[2]) : ''; })(),
        user_external_id: extId,
        user_phone: normalizedPhone,
        user_fn: nameParts[0] || '',
        user_ln: nameParts.slice(1).join(' ') || '',
        user_country: 'bd',
        landing_page_slug: '${slug}',
        custom_data: {
          event_id: eventId,
          value: purchaseParams.value,
          currency: purchaseParams.currency,
          content_name: purchaseParams.content_name,
          content_ids: purchaseParams.content_ids,
          content_type: 'product',
          content_category: 'ecommerce',
          num_items: purchaseParams.num_items,
          order_id: purchaseParams.order_id,
          predicted_ltv: purchaseParams.value,
          status: 'completed'
        }
      }),
      keepalive: true
    }).then(function(r){ return r.json(); }).then(function(d){
      console.log('[CAPI] Purchase sent from success page', d);
    }).catch(function(e){ console.warn('[CAPI] Error', e); });
  }

  // Try firing immediately
  if (!firePurchase()) {
    // Set as pending for SDK onload callback
    window.__pendingPurchase = firePurchase;
    // Also retry with interval as backup
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      if (firePurchase() || attempts >= 30) {
        clearInterval(timer);
        if (attempts >= 30 && !window.__purchaseFired) {
          console.error('[FB Pixel] SDK never loaded, Purchase not fired in browser');
        }
      }
    }, 500);
  }
})();
</script>
</body>
</html>`;

    try {
      document.open();
      document.write(html);
      document.close();
    } catch (e) {
      console.error("Failed to render success page", e);
    }
  }, [page, orderNumber, value, eventId]);

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  return <div />;
}