import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useEffect, useRef } from "react";
import { sanitizeHtmlScripts } from "@/lib/htmlSanitizer";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLandingPageBySlug(slug || "");
  const containerRef = useRef<HTMLDivElement>(null);

  // Tracking scripts are embedded inside the iframe srcDoc — no need to inject into parent document

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground mt-2">এই পেজটি পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  const buildFullHtml = () => {
    let trackingScripts = "";

    // Helper script for rich tracking data (PixelYourSite style)
    const richTrackingHelper = `
<script>
// PixelYourSite-style rich tracking helper
window._lpTrack = {
  generateEventId: function() {
    return 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now();
  },
  getDayName: function() {
    return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
  },
  getHourRange: function() {
    var h = new Date().getHours();
    return h + '-' + (h+1);
  },
  getMonthName: function() {
    return ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()];
  },
  getTrafficSource: function() {
    try { return document.referrer ? new URL(document.referrer).hostname : 'direct'; } catch(e) { return 'direct'; }
  },
  getCookie: function(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : '';
  },
  getFbp: function() { return this.getCookie('_fbp') || ''; },
  getFbc: function() {
    var fbc = this.getCookie('_fbc');
    if (!fbc) {
      var url = new URL(window.location.href);
      var fbclid = url.searchParams.get('fbclid');
      if (fbclid) fbc = 'fb.1.' + Date.now() + '.' + fbclid;
    }
    return fbc || '';
  },
  getBaseParams: function() {
    return {
      event_url: window.location.href,
      landing_page: window.location.href,
      page_title: document.title || '',
      traffic_source: this.getTrafficSource(),
      user_role: 'guest',
      event_day: this.getDayName(),
      event_hour: this.getHourRange(),
      event_month: this.getMonthName(),
      plugin: 'LovableLP'
    };
  },
  // Send server-side event via Conversions API
  sendServerEvent: function(eventName, customData) {
    var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
    var payload = {
      pixel_id: '${page.fb_pixel_id || ''}',
      event_name: eventName,
      event_id: customData.event_id || this.generateEventId(),
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: this.getFbp(),
      fbc: this.getFbc(),
      custom_data: customData
    };
    try {
      var blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
      navigator.sendBeacon(CAPI_URL, blob);
    } catch(e) {
      fetch(CAPI_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}).catch(function(){});
    }
  }
};
</script>
`;

    if (page.fb_pixel_id) {
      trackingScripts += `
<!-- Facebook Pixel with Advanced Matching -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${page.fb_pixel_id}');

// Rich PageView with custom parameters
var _eid = window._lpTrack ? window._lpTrack.generateEventId() : '';
var _baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};
fbq('track','PageView', {}, {eventID: _eid});

// Send server-side PageView
if (window._lpTrack && '${page.fb_pixel_id}') {
  window._lpTrack.sendServerEvent('PageView', {event_id: _eid});
}
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${page.fb_pixel_id}&ev=PageView&noscript=1"/></noscript>
`;
    }

    if (page.tiktok_pixel_id) {
      trackingScripts += `
<!-- TikTok Pixel -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
ttq.load('${page.tiktok_pixel_id}');
ttq.page();
}(window,document,'ttq');
</script>
`;
    }

    if (page.gtm_id) {
      trackingScripts += `
<!-- GTM -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${page.gtm_id}');</script>
`;
    }

    if (page.custom_head_scripts) {
      trackingScripts += `\n${page.custom_head_scripts}\n`;
    }

    // Enhanced conversion tracking with rich params
    const conversionScript = `
<!-- Enhanced Conversion Tracking (PixelYourSite-style) -->
<script>
(function(){
  function fireEvent(el) {
    var event = el.getAttribute('data-track-event');
    if (!event) return;

    var currency = el.getAttribute('data-track-currency') || 'BDT';
    var value = parseFloat(el.getAttribute('data-track-value') || '0');
    var contentName = el.getAttribute('data-track-content-name') || '';
    var contentId = el.getAttribute('data-track-content-id') || '';
    var contentType = el.getAttribute('data-track-content-type') || 'product';
    var categoryName = el.getAttribute('data-track-category') || '';
    var numItems = parseInt(el.getAttribute('data-track-num-items') || '1');
    var tags = el.getAttribute('data-track-tags') || '';

    var eventId = window._lpTrack ? window._lpTrack.generateEventId() : '';
    var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};

    // Facebook Pixel — rich params
    if (typeof fbq === 'function') {
      var fbParams = {
        value: value,
        currency: currency,
        content_type: contentType,
        num_items: numItems
      };
      if (contentName) fbParams.content_name = contentName;
      if (contentId) fbParams.content_ids = [contentId];
      if (categoryName) fbParams.content_category = categoryName;
      // Custom parameters merged
      fbParams.event_day = baseParams.event_day;
      fbParams.event_hour = baseParams.event_hour;
      fbParams.event_month = baseParams.event_month;
      fbParams.event_url = baseParams.event_url;
      fbParams.landing_page = baseParams.landing_page;
      fbParams.page_title = baseParams.page_title;
      fbParams.traffic_source = baseParams.traffic_source;
      fbParams.user_role = baseParams.user_role;
      fbParams.plugin = baseParams.plugin;
      if (tags) fbParams.tags = tags;
      if (value) fbParams.subtotal = value;

      fbq('track', event, fbParams, {eventID: eventId});
      console.log('[FB Pixel]', event, fbParams, 'eventID:', eventId);
    }

    // Server-side Conversions API
    if (window._lpTrack && '${page.fb_pixel_id}') {
      window._lpTrack.sendServerEvent(event, {
        event_id: eventId,
        value: value,
        currency: currency,
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: contentType,
        content_category: categoryName,
        num_items: numItems
      });
    }

    // TikTok Pixel
    if (typeof ttq !== 'undefined' && ttq.track) {
      var ttMap = {Purchase:'CompletePayment',AddToCart:'AddToCart',Lead:'SubmitForm',InitiateCheckout:'InitiateCheckout',ViewContent:'ViewContent',CompleteRegistration:'CompleteRegistration'};
      var ttEvent = ttMap[event] || event;
      var ttParams = {value: value, currency: currency, content_type: contentType};
      if (contentName) ttParams.content_name = contentName;
      if (contentId) ttParams.content_id = contentId;
      if (categoryName) ttParams.content_category = categoryName;
      ttParams.quantity = numItems;
      ttq.track(ttEvent, ttParams);
      console.log('[TikTok]', ttEvent, ttParams);
    }

    // GTM dataLayer — push all params
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        event: 'conversion_' + event,
        value: value,
        currency: currency,
        content_name: contentName,
        content_ids: contentId ? [contentId] : [],
        content_type: contentType,
        content_category: categoryName,
        num_items: numItems,
        event_day: baseParams.event_day,
        event_hour: baseParams.event_hour,
        traffic_source: baseParams.traffic_source
      });
    }
  }

  // Auto-fire ViewContent with rich params from data attributes on body or main container
  document.addEventListener('DOMContentLoaded', function() {
    var vc = document.querySelector('[data-track-view-content]');
    if (vc && typeof fbq === 'function') {
      var eventId = window._lpTrack ? window._lpTrack.generateEventId() : '';
      var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};
      var vcParams = {
        content_name: vc.getAttribute('data-content-name') || document.title,
        content_ids: vc.getAttribute('data-content-id') ? [vc.getAttribute('data-content-id')] : [],
        content_type: vc.getAttribute('data-content-type') || 'product',
        content_category: vc.getAttribute('data-content-category') || '',
        value: parseFloat(vc.getAttribute('data-content-value') || '0'),
        currency: vc.getAttribute('data-content-currency') || 'BDT',
        event_day: baseParams.event_day,
        event_hour: baseParams.event_hour,
        event_month: baseParams.event_month,
        traffic_source: baseParams.traffic_source,
        landing_page: baseParams.landing_page,
        page_title: baseParams.page_title,
        user_role: 'guest',
        plugin: 'LovableLP'
      };
      fbq('track', 'ViewContent', vcParams, {eventID: eventId});
      if (window._lpTrack) window._lpTrack.sendServerEvent('ViewContent', {event_id: eventId, ...vcParams});
    }
  });

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-track-event]');
    if (el) fireEvent(el);
  });
})();
</script>
`;

    // Analytics tracking
    const analyticsScript = `
<!-- Landing Page Analytics -->
<script>
(function(){
  var TRACK_URL = '${supabaseUrl}/functions/v1/track-landing-event';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid');
  if (!VID) { VID = 'v_' + Math.random().toString(36).substr(2,9) + Date.now(); localStorage.setItem('_lp_vid', VID); }

  function send(eventType, eventName) {
    try {
      var blob = new Blob([JSON.stringify({slug:SLUG,event_type:eventType,event_name:eventName||null,visitor_id:VID,referrer:document.referrer||null})], {type: 'application/json'});
      navigator.sendBeacon(TRACK_URL, blob);
    } catch(e) {
      fetch(TRACK_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({slug:SLUG,event_type:eventType,event_name:eventName||null,visitor_id:VID,referrer:document.referrer||null})}).catch(function(){});
    }
  }
  send('view');
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-track-event]');
    if (el) {
      send('conversion', el.getAttribute('data-track-event'));
    } else if (e.target.closest('a, button, [role="button"], input[type="submit"]')) {
      send('click', (e.target.closest('a, button, [role="button"], input[type="submit"]').textContent || '').trim().substring(0, 50));
    }
  });
})();
</script>
`;

    // Exit Intent Popup - only if enabled
    const exitPopupEnabled = (page as any).exit_popup_enabled ?? false;
    const exitDiscount = (page as any).exit_popup_discount ?? 50;
    const exitTimer = (page as any).exit_popup_timer ?? 300;
    const exitMessage = (page as any).exit_popup_message || 'এই ছাড়টি শুধু আপনার জন্য!';
    const exitInitMin = String(Math.floor(exitTimer / 60)).padStart(2, '0');
    const exitInitSec = String(exitTimer % 60).padStart(2, '0');

    const exitIntentScript = !exitPopupEnabled ? '' : `
<!-- Exit Intent Popup -->
<style>
#exit-overlay{display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(4px)}
#exit-overlay.show{display:flex}
#exit-box{position:relative;width:90%;max-width:380px;animation:exitZoom .3s ease}
@keyframes exitZoom{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}
#exit-close{position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;background:#fff;border:none;box-shadow:0 2px 8px rgba(0,0,0,.2);cursor:pointer;font-size:18px;font-weight:bold;color:#666;z-index:1;display:flex;align-items:center;justify-content:center}
#exit-inner{border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 25px 50px rgba(0,0,0,.25)}
#exit-header{background:linear-gradient(135deg,#ef4444,#f97316);color:#fff;text-align:center;padding:10px 16px}
#exit-header p{margin:0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
#exit-body{padding:24px;text-align:center}
#exit-timer{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:16px}
.timer-box{background:#111;color:#fff;border-radius:8px;padding:8px 12px;min-width:56px;text-align:center}
.timer-box span{font-size:24px;font-weight:900;font-variant-numeric:tabular-nums;display:block}
.timer-box small{font-size:9px;color:#999;text-transform:uppercase}
.timer-sep{font-size:24px;font-weight:900;color:#111;animation:pulse 1s infinite}
#exit-badge{display:inline-block;width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#facc15,#f97316);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;box-shadow:0 8px 24px rgba(249,115,22,.3);position:relative}
#exit-badge .amt{color:#fff;font-size:28px;font-weight:900;line-height:1}
#exit-badge .lbl{color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
#exit-badge .gift{position:absolute;top:-4px;right:-4px;width:28px;height:28px;background:#ef4444;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;animation:bounce 1s infinite}
@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
#exit-body h3{font-size:20px;font-weight:900;color:#111;margin:0 0 4px}
#exit-body .sub{font-size:14px;color:#888;margin:0 0 4px}
#exit-body .price{font-size:24px;font-weight:900;color:#ef4444;margin:0 0 12px}
#exit-warn{background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:10px;margin-bottom:16px}
#exit-warn p{margin:0;font-size:12px;color:#a16207;font-weight:600}
#exit-accept{width:100%;padding:14px;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(34,197,94,.3);transition:all .2s}
#exit-accept:hover{transform:scale(1.02);box-shadow:0 12px 32px rgba(34,197,94,.4)}
#exit-accept:active{transform:scale(.97)}
#exit-reject{display:block;margin:8px auto 0;background:none;border:none;color:#bbb;font-size:12px;cursor:pointer}
#exit-reject:hover{color:#888}
</style>
<div id="exit-overlay">
  <div id="exit-box">
    <button id="exit-close" onclick="closeExitPopup()">✕</button>
    <div id="exit-inner">
      <div id="exit-header"><p>⚡ বিশেষ অফার — শুধুমাত্র আপনার জন্য! ⚡</p></div>
      <div id="exit-body">
        <div id="exit-timer">
          <div class="timer-box"><span id="exit-min">${exitInitMin}</span><small>মিনিট</small></div>
          <span class="timer-sep">:</span>
          <div class="timer-box"><span id="exit-sec">${exitInitSec}</span><small>সেকেন্ড</small></div>
        </div>
        <div id="exit-badge"><div><span class="amt">৳${exitDiscount}</span><span class="lbl">ছাড়!</span></div><div class="gift">🎁</div></div>
        <h3>${escapeHtml(exitMessage)}</h3>
        <p class="sub">আজকেই অর্ডার করুন এবং পান</p>
        <p class="price">৳${exitDiscount} টাকা ছাড়!</p>
        <div id="exit-warn"><p>⏰ এই অফার <span id="exit-time-text">${Math.floor(exitTimer / 60)} মিনিটে</span> শেষ হবে!</p></div>
        <button id="exit-accept" onclick="acceptExitOffer()">🎉 ৳${exitDiscount} ছাড়ে অর্ডার করুন</button>
        <button id="exit-reject" onclick="closeExitPopup()">না, ছাড় লাগবে না</button>
      </div>
    </div>
  </div>
</div>
<script>
(function(){
  var shown = false;
  var dismissed = sessionStorage.getItem('_exit_dismissed');
  var timeLeft = ${exitTimer};
  var DISCOUNT = ${exitDiscount};
  var timerInterval = null;

  function updateTimer(){
    var m = Math.floor(timeLeft/60), s = timeLeft%60;
    var minEl = document.getElementById('exit-min');
    var secEl = document.getElementById('exit-sec');
    var txtEl = document.getElementById('exit-time-text');
    if(minEl) minEl.textContent = String(m).padStart(2,'0');
    if(secEl) secEl.textContent = String(s).padStart(2,'0');
    if(txtEl) txtEl.textContent = m>0 ? m+' মিনিট '+s+' সেকেন্ডে' : s+' সেকেন্ডে';
    timeLeft--;
    if(timeLeft<0){ clearInterval(timerInterval); closeExitPopup(); }
  }

  function showExitPopup(){
    if(shown || dismissed) return;
    shown = true;
    var ov = document.getElementById('exit-overlay');
    if(ov) ov.classList.add('show');
    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    if(typeof fbq==='function'){
      var eid = window._lpTrack ? window._lpTrack.generateEventId() : '';
      fbq('trackCustom','ExitIntentShown',{page:window.location.href,discount:DISCOUNT},{eventID:eid});
    }
    if(typeof ttq!=='undefined'&&ttq.track) ttq.track('ViewContent',{content_name:'ExitIntentPopup'});
  }

  window.closeExitPopup = function(){
    var ov = document.getElementById('exit-overlay');
    if(ov) ov.classList.remove('show');
    if(timerInterval) clearInterval(timerInterval);
    sessionStorage.setItem('_exit_dismissed','1');
  };

  window.acceptExitOffer = function(){
    sessionStorage.setItem('_exit_discount', String(DISCOUNT));
    sessionStorage.setItem('_exit_dismissed','1');
    if(typeof fbq==='function'){
      var eid = window._lpTrack ? window._lpTrack.generateEventId() : '';
      fbq('trackCustom','ExitOfferAccepted',{value:DISCOUNT,currency:'BDT'},{eventID:eid});
    }
    var ov = document.getElementById('exit-overlay');
    if(ov) ov.classList.remove('show');
    if(timerInterval) clearInterval(timerInterval);
    var form = document.querySelector('form, [data-checkout], #checkout, #order-form, .checkout, .order-form');
    if(form) form.scrollIntoView({behavior:'smooth',block:'center'});
    var discountField = document.querySelector('[name="discount"], [data-discount], #discount');
    if(discountField) discountField.value = String(DISCOUNT);
  };

  document.addEventListener('mouseout',function(e){
    if(e.clientY<=0 && !e.relatedTarget && !e.toElement) showExitPopup();
  });
  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden') showExitPopup();
  });
  var lastScroll=0, scrollUpCount=0;
  window.addEventListener('scroll',function(){
    var st=window.pageYOffset||document.documentElement.scrollTop;
    if(st<lastScroll && lastScroll-st>100){ scrollUpCount++; if(scrollUpCount>=3) showExitPopup(); }
    else scrollUpCount=0;
    lastScroll=st;
  },{passive:true});

  var originalShow = showExitPopup;
  var canShow = false;
  setTimeout(function(){ canShow=true; },5000);
  showExitPopup = function(){ if(canShow) originalShow(); };
})();
</script>
`;

    // ═══ Checkout form handling scripts (order submission, partial tracking, phone validation) ═══
    const partialTrackingScript = `
<script>
(function(){
  var PARTIAL_URL = '${supabaseUrl}/functions/v1/track-partial-order';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid') || '';
  var _partialTimer = null;
  var _lastSent = '';

  function getFormData(form) {
    var fd = new FormData(form);
    return {
      customer_name: fd.get('customer_name') || '',
      customer_phone: fd.get('customer_phone') || '',
      customer_address: fd.get('customer_address') || '',
      product_name: fd.get('product_name') || form.getAttribute('data-product-name') || '',
      product_code: fd.get('product_code') || form.getAttribute('data-product-code') || '',
      quantity: parseInt(fd.get('quantity') || form.getAttribute('data-quantity') || '1'),
      unit_price: parseFloat(fd.get('unit_price') || form.getAttribute('data-unit-price') || '0'),
      delivery_charge: parseFloat(fd.get('delivery_charge') || form.getAttribute('data-delivery-charge') || '0'),
      discount: parseFloat(fd.get('discount') || form.getAttribute('data-discount') || '0')
    };
  }

  function sendPartial(form) {
    var d = getFormData(form);
    if (!d.customer_name && !d.customer_phone && !d.customer_address) return;
    var key = JSON.stringify(d);
    if (key === _lastSent) return;
    _lastSent = key;
    var payload = Object.assign({}, d, { action: 'save_partial', landing_page_slug: SLUG, visitor_id: VID });
    try { var blob = new Blob([JSON.stringify(payload)], {type: 'application/json'}); navigator.sendBeacon(PARTIAL_URL, blob); } catch(e) { fetch(PARTIAL_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}).catch(function(){}); }
  }

  document.addEventListener('input', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    if (_partialTimer) clearTimeout(_partialTimer);
    _partialTimer = setTimeout(function(){ sendPartial(form); }, 2000);
  });
  document.addEventListener('focusout', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    if (_partialTimer) clearTimeout(_partialTimer);
    _partialTimer = setTimeout(function(){ sendPartial(form); }, 500);
  });
  window.addEventListener('beforeunload', function() {
    var forms = document.querySelectorAll('[data-checkout-form]');
    for (var i = 0; i < forms.length; i++) { sendPartial(forms[i]); }
  });
  window._removePartial = function() {
    try { var blob = new Blob([JSON.stringify({ action: 'remove_partial', landing_page_slug: SLUG, visitor_id: VID })], {type: 'application/json'}); navigator.sendBeacon(PARTIAL_URL, blob); } catch(e) {}
  };
})();
</script>`;

    const phoneValidationScript = `
<script>
(function(){
  var bengaliMap = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
  function sanitizePhone(val) {
    var result = '';
    for (var i = 0; i < val.length; i++) {
      var ch = val[i];
      if (bengaliMap[ch]) { result += bengaliMap[ch]; }
      else if (/[0-9]/.test(ch)) { result += ch; }
      else if (ch === '+' && result.length === 0) { result += ch; }
    }
    return result;
  }
  function isValidBDPhone(phone) {
    var cleaned = phone.replace(/^\\+?880/, '0');
    return /^01[3-9]\\d{8}$/.test(cleaned);
  }
  document.addEventListener('input', function(e) {
    if (e.target && (e.target.name === 'customer_phone' || e.target.name === 'phone' || e.target.type === 'tel')) {
      e.target.value = sanitizePhone(e.target.value);
    }
  });
  document.addEventListener('submit', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    var phoneInput = form.querySelector('[name="customer_phone"]') || form.querySelector('[name="phone"]') || form.querySelector('[type="tel"]');
    if (phoneInput && !isValidBDPhone(phoneInput.value)) {
      e.preventDefault(); e.stopImmediatePropagation();
      alert('অনুগ্রহ করে সঠিক বাংলাদেশের মোবাইল নম্বর দিন (01XXXXXXXXX)');
      phoneInput.focus(); return false;
    }
  }, true);
})();
</script>`;

    const orderScript = `
<script>
(function(){
  var ORDER_URL = '${supabaseUrl}/functions/v1/submit-landing-order';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid') || '';

  document.addEventListener('submit', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    e.preventDefault();

    var btn = form.querySelector('[type="submit"], button:not([type])');
    var btnOrigText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...'; }

    var formData = new FormData(form);
    var payload = {
      customer_name: formData.get('customer_name') || '',
      customer_phone: formData.get('customer_phone') || '',
      customer_address: formData.get('customer_address') || '',
      product_name: formData.get('product_name') || form.getAttribute('data-product-name') || '',
      product_code: formData.get('product_code') || form.getAttribute('data-product-code') || '',
      quantity: parseInt(formData.get('quantity') || form.getAttribute('data-quantity') || '1'),
      unit_price: parseFloat(formData.get('unit_price') || form.getAttribute('data-unit-price') || '0'),
      delivery_charge: parseFloat(formData.get('delivery_charge') || form.getAttribute('data-delivery-charge') || '0'),
      discount: parseFloat(formData.get('discount') || form.getAttribute('data-discount') || '0'),
      notes: formData.get('notes') || '',
      landing_page_slug: SLUG,
      visitor_id: VID
    };

    fetch(ORDER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        if (window._removePartial) window._removePartial();
        var totalValue = payload.unit_price * payload.quantity;
        var eventId = window._lpTrack ? window._lpTrack.generateEventId() : '';
        var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};

        if (typeof fbq === 'function') {
          var pp = { value: totalValue, currency: 'BDT', content_type: 'product', content_name: payload.product_name, content_ids: payload.product_code ? [payload.product_code] : [], num_items: payload.quantity, subtotal: totalValue, event_day: baseParams.event_day||'', event_hour: baseParams.event_hour||'', event_month: baseParams.event_month||'', event_url: baseParams.event_url||window.location.href, landing_page: baseParams.landing_page||window.location.href, page_title: document.title||'', traffic_source: baseParams.traffic_source||'direct', user_role:'guest', plugin:'LovableLP', order_id: data.order_number };
          fbq('track', 'Purchase', pp, {eventID: eventId});
        }
        if (window._lpTrack && '${page.fb_pixel_id}') {
          window._lpTrack.sendServerEvent('Purchase', { event_id: eventId, value: totalValue, currency: 'BDT', content_name: payload.product_name, content_ids: payload.product_code?[payload.product_code]:[], content_type:'product', num_items: payload.quantity, order_id: data.order_number });
        }
        if (typeof ttq !== 'undefined' && ttq.track) {
          ttq.track('CompletePayment', { value: totalValue, currency: 'BDT', content_name: payload.product_name, content_id: payload.product_code||'', content_type:'product', quantity: payload.quantity });
        }
        if (typeof dataLayer !== 'undefined') {
          dataLayer.push({ event:'conversion_Purchase', value: totalValue, currency:'BDT', content_name: payload.product_name, order_id: data.order_number, num_items: payload.quantity });
        }

        var successUrl = form.getAttribute('data-success-url');
        if (successUrl) { window.location.href = successUrl; }
        else {
          var msg = form.getAttribute('data-success-message') || 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + data.order_number;
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;"><div style="text-align:center;padding:40px;"><h1 style="color:#10b981;font-size:48px;">✓</h1><h2 style="margin:16px 0;">অর্ডার সফল!</h2><p>' + msg + '</p></div></div>';
        }
      } else {
        alert(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে');
        if (btn) { btn.disabled = false; btn.textContent = btnOrigText || 'অর্ডার করুন'; }
      }
    })
    .catch(function(err) {
      alert('ত্রুটি: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = btnOrigText || 'অর্ডার করুন'; }
    });
  });
})();
</script>`;

    const autocompleteScript = `
<script>
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var map = {customer_name:'name', customer_phone:'tel', customer_address:'street-address'};
    for(var n in map){
      var el = document.querySelector('[name="'+n+'"]');
      if(el && !el.getAttribute('autocomplete')) el.setAttribute('autocomplete', map[n]);
    }
  });
})();
</script>`;

    const allScripts = richTrackingHelper + trackingScripts + conversionScript + analyticsScript + partialTrackingScript + phoneValidationScript + orderScript + autocompleteScript + exitIntentScript;

    const cleanHtml = sanitizeHtmlScripts(page.html_content);

    if (cleanHtml.includes("</head>")) {
      return cleanHtml.replace("</head>", `${allScripts}</head>`);
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${allScripts}</head><body>${cleanHtml}</body></html>`;
  };

  return (
    <iframe
      srcDoc={buildFullHtml()}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title={page.title}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}

