import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useRef } from "react";

export default function LandingPageCheckout() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLandingPageBySlug(slug || "");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error || !page || !page.checkout_html) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground mt-2">Checkout পেজ পাওয়া যায়নি</p>
        </div>
      </div>
    );
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";

  const buildCheckoutHtml = () => {
    let trackingScripts = "";

    // Rich tracking helper
    const richTrackingHelper = `
<script>
window._lpTrack = {
  generateEventId: function() { return 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now(); },
  getDayName: function() { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]; },
  getHourRange: function() { var h = new Date().getHours(); return h + '-' + (h+1); },
  getMonthName: function() { return ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()]; },
  getTrafficSource: function() { try { return document.referrer ? new URL(document.referrer).hostname : 'direct'; } catch(e) { return 'direct'; } },
  getCookie: function(name) { var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)'); return v ? decodeURIComponent(v[2]) : ''; },
  getFbp: function() { return this.getCookie('_fbp') || ''; },
  getFbc: function() { var fbc = this.getCookie('_fbc'); if (!fbc) { try { var fbclid = new URL(window.location.href).searchParams.get('fbclid'); if (fbclid) fbc = 'fb.1.' + Date.now() + '.' + fbclid; } catch(e){} } return fbc || ''; },
  getBaseParams: function() {
    return { event_url: window.location.href, landing_page: window.location.href, page_title: document.title || 'Checkout', traffic_source: this.getTrafficSource(), user_role: 'guest', event_day: this.getDayName(), event_hour: this.getHourRange(), event_month: this.getMonthName(), plugin: 'LovableLP' };
  },
  sendServerEvent: function(eventName, customData) {
    var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
    var payload = { pixel_id: '${page.fb_pixel_id || ''}', event_name: eventName, event_id: customData.event_id || this.generateEventId(), event_url: window.location.href, user_agent: navigator.userAgent, fbp: this.getFbp(), fbc: this.getFbc(), custom_data: customData };
    try { navigator.sendBeacon(CAPI_URL, JSON.stringify(payload)); } catch(e) { fetch(CAPI_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}).catch(function(){}); }
  }
};
</script>
`;

    if (page.fb_pixel_id) {
      trackingScripts += `
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${page.fb_pixel_id}');
var _eid = window._lpTrack.generateEventId();
var _bp = window._lpTrack.getBaseParams();
fbq('track','PageView', {}, {eventID: _eid});
window._lpTrack.sendServerEvent('PageView', {event_id: _eid});

// InitiateCheckout with rich params
var _icEid = window._lpTrack.generateEventId();
var _icForm = document.querySelector ? document.querySelector('[data-checkout-form]') : null;
setTimeout(function() {
  _icForm = document.querySelector('[data-checkout-form]');
  var icParams = {
    content_type: 'product',
    currency: 'BDT',
    page_title: 'Checkout',
    event_day: _bp.event_day,
    event_hour: _bp.event_hour,
    event_month: _bp.event_month,
    traffic_source: _bp.traffic_source,
    user_role: 'guest',
    plugin: 'LovableLP',
    event_url: window.location.href,
    landing_page: window.location.href
  };
  if (_icForm) {
    icParams.content_name = _icForm.getAttribute('data-product-name') || '';
    icParams.content_ids = _icForm.getAttribute('data-product-code') ? [_icForm.getAttribute('data-product-code')] : [];
    icParams.value = parseFloat(_icForm.getAttribute('data-unit-price') || '0');
    icParams.content_category = _icForm.getAttribute('data-category') || '';
    icParams.num_items = parseInt(_icForm.getAttribute('data-quantity') || '1');
    icParams.subtotal = icParams.value;
  }
  fbq('track', 'InitiateCheckout', icParams, {eventID: _icEid});
  window._lpTrack.sendServerEvent('InitiateCheckout', {event_id: _icEid, ...icParams});
}, 100);
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${page.fb_pixel_id}&ev=PageView&noscript=1"/></noscript>
`;
    }

    if (page.tiktok_pixel_id) {
      trackingScripts += `
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
ttq.load('${page.tiktok_pixel_id}');
ttq.page();
ttq.track('InitiateCheckout');
}(window,document,'ttq');
</script>`;
    }

    if (page.gtm_id) {
      trackingScripts += `
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${page.gtm_id}');</script>`;
    }

    if (page.custom_head_scripts) {
      trackingScripts += `\n${page.custom_head_scripts}\n`;
    }

    // Partial form tracking script
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

    var payload = Object.assign({}, d, {
      action: 'save_partial',
      landing_page_slug: SLUG,
      visitor_id: VID
    });

    try {
      navigator.sendBeacon(PARTIAL_URL, JSON.stringify(payload));
    } catch(e) {
      fetch(PARTIAL_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}).catch(function(){});
    }
  }

  // Listen for input changes on checkout forms
  document.addEventListener('input', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    if (_partialTimer) clearTimeout(_partialTimer);
    _partialTimer = setTimeout(function(){ sendPartial(form); }, 2000);
  });

  // Also send on blur (when user leaves a field)
  document.addEventListener('focusout', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    if (_partialTimer) clearTimeout(_partialTimer);
    _partialTimer = setTimeout(function(){ sendPartial(form); }, 500);
  });

  // Send on page unload if there's partial data
  window.addEventListener('beforeunload', function() {
    var forms = document.querySelectorAll('[data-checkout-form]');
    for (var i = 0; i < forms.length; i++) {
      sendPartial(forms[i]);
    }
  });

  // Expose remove function for after successful order
  window._removePartial = function() {
    try {
      navigator.sendBeacon(PARTIAL_URL, JSON.stringify({
        action: 'remove_partial',
        landing_page_slug: SLUG,
        visitor_id: VID
      }));
    } catch(e) {}
  };
})();
</script>`;

    // Enhanced order submission with rich Purchase event
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

    fetch(ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success) {
        // Remove partial incomplete order on success
        if (window._removePartial) window._removePartial();

        var totalValue = payload.unit_price * payload.quantity;
        var eventId = window._lpTrack ? window._lpTrack.generateEventId() : '';
        var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};

        // FB Purchase with ALL PixelYourSite-style params
        if (typeof fbq === 'function') {
          var purchaseParams = {
            value: totalValue,
            currency: 'BDT',
            content_type: 'product',
            content_name: payload.product_name,
            content_ids: payload.product_code ? [payload.product_code] : [],
            num_items: payload.quantity,
            content_category: form.getAttribute('data-category') || '',
            subtotal: totalValue,
            event_day: baseParams.event_day || '',
            event_hour: baseParams.event_hour || '',
            event_month: baseParams.event_month || '',
            event_url: baseParams.event_url || window.location.href,
            landing_page: baseParams.landing_page || window.location.href,
            page_title: 'Checkout',
            traffic_source: baseParams.traffic_source || 'direct',
            user_role: 'guest',
            plugin: 'LovableLP',
            tags: form.getAttribute('data-tags') || '',
            order_id: data.order_number
          };
          fbq('track', 'Purchase', purchaseParams, {eventID: eventId});
          console.log('[FB Pixel] Purchase', purchaseParams);
        }

        // Server-side Purchase via Conversions API
        if (window._lpTrack && '${page.fb_pixel_id}') {
          window._lpTrack.sendServerEvent('Purchase', {
            event_id: eventId,
            value: totalValue,
            currency: 'BDT',
            content_name: payload.product_name,
            content_ids: payload.product_code ? [payload.product_code] : [],
            content_type: 'product',
            num_items: payload.quantity,
            order_id: data.order_number
          });
        }

        // TikTok CompletePayment
        if (typeof ttq !== 'undefined' && ttq.track) {
          ttq.track('CompletePayment', {
            value: totalValue,
            currency: 'BDT',
            content_name: payload.product_name,
            content_id: payload.product_code || '',
            content_type: 'product',
            quantity: payload.quantity
          });
        }

        // GTM
        if (typeof dataLayer !== 'undefined') {
          dataLayer.push({
            event: 'conversion_Purchase',
            value: totalValue,
            currency: 'BDT',
            content_name: payload.product_name,
            order_id: data.order_number,
            num_items: payload.quantity
          });
        }

        var successUrl = form.getAttribute('data-success-url');
        if (successUrl) {
          window.location.href = successUrl;
        } else {
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

    const allScripts = richTrackingHelper + trackingScripts + orderScript;

    if (page.checkout_html!.includes("</head>")) {
      return page.checkout_html!.replace("</head>", `${allScripts}</head>`);
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${allScripts}</head><body>${page.checkout_html}</body></html>`;
  };

  return (
    <iframe
      ref={iframeRef}
      srcDoc={buildCheckoutHtml()}
      style={{ width: "100%", height: "100vh", border: "none" }}
      title={`${page.title} - Checkout`}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
