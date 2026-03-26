import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useRef } from "react";
import { deferLandingMarkupScripts, landingDeferredScriptLoader, optimizeLandingEmbeds, optimizeLandingImages, sanitizeHtmlScripts } from "@/lib/htmlSanitizer";
import { landingPhoneValidationScript, normalizeLandingPhoneHtml } from "@/lib/landingPhoneHtml";

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
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

  const buildCheckoutHtml = () => {
    let trackingScripts = "";
    let deferredPixelScripts = "";

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
  _userData: {},
  setUserData: function(data) {
    this._userData = Object.assign(this._userData || {}, data || {});
    try { sessionStorage.setItem('_lp_fb_ud_checkout', JSON.stringify(this._userData)); } catch(e) {}
  },
  getUserData: function() {
    if (this._userData && Object.keys(this._userData).length > 0) return this._userData;
    try {
      var stored = sessionStorage.getItem('_lp_fb_ud_checkout');
      if (stored) {
        this._userData = JSON.parse(stored);
        return this._userData;
      }
    } catch(e) {}
    return {};
  },
  normalizePhone: function(ph) {
    if (!ph) return '';
    var cleaned = String(ph).replace(/[^0-9]/g, '');
    if (cleaned.indexOf('880') === 0) return cleaned;
    if (cleaned.indexOf('0') === 0) return '880' + cleaned.substring(1);
    if (cleaned.length === 10) return '880' + cleaned;
    return cleaned;
  },
  sendServerEvent: function(eventName, customData, userData) {
    var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
    var ANON = '${anonKey}';
    var extId = '';
    try { extId = localStorage.getItem('_lp_vid') || localStorage.getItem('_vid') || ''; } catch(e) {}
    if (!extId) {
      extId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2,12);
      try { localStorage.setItem('_lp_vid', extId); } catch(e) {}
    }
    var ud = Object.assign({}, this.getUserData(), userData || {});
    if (Object.keys(ud).length > 0) this.setUserData(ud);
    var payload = {
      pixel_id: '${page.fb_pixel_id || ''}',
      event_name: eventName,
      event_id: customData.event_id || this.generateEventId(),
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: this.getFbp(),
      fbc: this.getFbc(),
      custom_data: customData,
      landing_page_slug: '${page.slug || ''}',
      user_external_id: ud.order_id || extId,
      user_country: 'bd'
    };
    if (ud.phone) payload.user_phone = this.normalizePhone(ud.phone);
    if (ud.name) {
      var parts = String(ud.name).trim().split(/\s+/);
      payload.user_fn = parts[0] || '';
      payload.user_ln = parts.slice(1).join(' ') || '';
    }
    if (ud.city) payload.user_ct = ud.city;
    try {
      fetch(CAPI_URL, {
        method: 'POST',
        headers: {'Content-Type':'application/json','apikey':ANON},
        body: JSON.stringify(payload),
        keepalive: true,
        credentials: 'omit'
      }).catch(function(){});
    } catch(e) {
      try {
        var blob = new Blob([JSON.stringify(payload)], {type: 'text/plain'});
        navigator.sendBeacon(CAPI_URL + '?apikey=' + ANON, blob);
      } catch(e2) {}
    }
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
      deferredPixelScripts += `
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
ttq.load('${page.tiktok_pixel_id}');
ttq.page();
ttq.track('InitiateCheckout');
}(window,document,'ttq');
</script>`;
    }

    if (page.gtm_id) {
      deferredPixelScripts += `
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${page.gtm_id}');</script>`;
    }

    if (page.custom_head_scripts) {
      deferredPixelScripts += `\n${page.custom_head_scripts}\n`;
    }

    // Partial form tracking script
    const partialTrackingScript = `
<script>
(function(){
  var PARTIAL_URL = '${supabaseUrl}/functions/v1/track-partial-order';
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid') || '';
  if (!VID) {
    VID = 'v_' + Math.random().toString(36).substr(2,9) + Date.now();
    try { localStorage.setItem('_lp_vid', VID); } catch(e) {}
  }

  var ROOT_SELECTOR = '[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form, .checkout, #checkout, [id*="checkout"], [class*="checkout"], [id*="order"], [class*="order"]';
  var _partialTimer = null;
  var _lastSent = '';
  var _autosaveTimer = null;
  var _orderDone = false;
  var _lastPostedBody = '';
  var _lastPostedAt = 0;
  var _lastFlushAt = 0;

  function parseNumber(value, fallback) {
    var cleaned = String(value == null ? '' : value).replace(/[^\d.-]/g, '');
    var parsed = parseFloat(cleaned);
    return isNaN(parsed) ? fallback : parsed;
  }

  function postJson(payload, options) {
    options = options || {};
    var body = JSON.stringify(payload);
    var now = Date.now();
    if (body === _lastPostedBody && (now - _lastPostedAt) < 1500) return;
    _lastPostedBody = body;
    _lastPostedAt = now;
    var sent = false;
    if (!options.forceFetch) {
      try {
        if (navigator.sendBeacon) {
          sent = navigator.sendBeacon(PARTIAL_URL + '?apikey=' + ANON, new Blob([body], { type: 'application/json' }));
        }
      } catch(e) {}
    }
    if (!sent) {
      fetch(PARTIAL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON },
        body: body,
        keepalive: true,
      }).catch(function(){});
    }
  }

  function ensureAutosave() {
    if (_autosaveTimer) return;
    _autosaveTimer = setInterval(function() {
      if (_orderDone) { clearInterval(_autosaveTimer); _autosaveTimer = null; return; }
      var roots = getCandidateRoots();
      for (var i = 0; i < roots.length; i++) sendPartial(roots[i], { allowRepeat: true });
    }, 8000);
  }

  function uniqueNodes(nodes) {
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i] && out.indexOf(nodes[i]) === -1) out.push(nodes[i]);
    }
    return out;
  }

  function queryNodes(root, selectors) {
    var nodes = [];
    for (var i = 0; i < selectors.length; i++) {
      var selector = selectors[i];
      if (root.matches && root.matches(selector)) nodes.push(root);
      var found = root.querySelectorAll(selector);
      for (var j = 0; j < found.length; j++) nodes.push(found[j]);
    }
    return uniqueNodes(nodes);
  }

  function readNodeValue(node, selector) {
    if (!node) return '';

    if (selector.indexOf('data-') !== -1 && node.getAttribute) {
      var attrMatch = selector.match(/data-[a-z-]+/);
      if (attrMatch) {
        var attrValue = node.getAttribute(attrMatch[0]);
        if (attrValue) return String(attrValue).trim();
        return '';
      }
    }

    var tag = (node.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      var type = (node.getAttribute('type') || '').toLowerCase();
      if ((type === 'radio' || type === 'checkbox') && !node.checked) return '';
      return String(node.value || '').trim();
    }

    return String(node.textContent || '').trim();
  }

  function readValue(root, selectors) {
    var nodes = queryNodes(root, selectors);
    for (var i = 0; i < nodes.length; i++) {
      for (var j = 0; j < selectors.length; j++) {
        var value = readNodeValue(nodes[i], selectors[j]);
        if (value) return value;
      }
    }
    return '';
  }

  function getFieldSelectors() {
    return {
      customer_name: ['[name="customer_name"]', '[name="name"]', '[name="full_name"]', 'input[autocomplete="name"]', 'input[placeholder*="নাম"]'],
      customer_phone: ['[name="customer_phone"]', '[name="phone"]', '[name="mobile"]', '[name="customer_mobile"]', '[name="contact_number"]', 'input[type="tel"]', 'input[inputmode="tel"]', 'input[placeholder*="মোবাইল"]', 'input[placeholder*="ফোন"]'],
      customer_address: ['[name="customer_address"]', '[name="address"]', '[name="full_address"]', '[name="shipping_address"]', 'textarea[placeholder*="ঠিকানা"]', 'input[autocomplete="street-address"]'],
      product_name: ['[name="product_name"]', '[data-product-name]'],
      product_code: ['[name="product_code"]', '[data-product-code]'],
      quantity: ['[name="quantity"]', '[data-quantity]', 'select[name*="qty"]', 'select[name*="quantity"]', 'input[type="number"]'],
      unit_price: ['[name="unit_price"]', '[data-unit-price]'],
      delivery_charge: ['[name="delivery_charge"]', '[data-delivery-charge]'],
      discount: ['[name="discount"]', '[data-discount]']
    };
  }

  function looksLikeCheckoutRoot(root) {
    if (!root || typeof root.querySelector !== 'function') return false;
    var fields = getFieldSelectors();
    return !!(
      queryNodes(root, fields.customer_name).length ||
      queryNodes(root, fields.customer_phone).length ||
      queryNodes(root, fields.customer_address).length ||
      root.querySelector('input, textarea, select')
    );
  }

  function getCandidateRoots() {
    var nodes = uniqueNodes(Array.prototype.slice.call(document.querySelectorAll(ROOT_SELECTOR)));
    var roots = [];
    for (var i = 0; i < nodes.length; i++) {
      if (looksLikeCheckoutRoot(nodes[i])) roots.push(nodes[i]);
    }
    return roots;
  }

  function resolveRoot(target) {
    if (target && typeof target.closest === 'function') {
      var direct = target.closest(ROOT_SELECTOR);
      if (looksLikeCheckoutRoot(direct)) return direct;
    }

    var roots = getCandidateRoots();
    if (target) {
      for (var i = 0; i < roots.length; i++) {
        if (roots[i] === target || (typeof roots[i].contains === 'function' && roots[i].contains(target))) {
          return roots[i];
        }
      }
    }

    return roots[0] || null;
  }

  function getFormData(root) {
    var fields = getFieldSelectors();
    var quantityValue = readValue(root, fields.quantity);
    var unitPriceValue = readValue(root, fields.unit_price);
    var deliveryChargeValue = readValue(root, fields.delivery_charge);
    var discountValue = readValue(root, fields.discount) || sessionStorage.getItem('_exit_discount') || '0';

    return {
      customer_name: readValue(root, fields.customer_name),
      customer_phone: readValue(root, fields.customer_phone),
      customer_address: readValue(root, fields.customer_address),
      product_name: (readValue(root, fields.product_name) || document.title || '').substring(0, 150),
      product_code: readValue(root, fields.product_code) || root.getAttribute('data-product-code') || '',
      quantity: parseNumber(quantityValue || root.getAttribute('data-quantity') || '1', 1),
      unit_price: parseNumber(unitPriceValue || root.getAttribute('data-unit-price') || '0', 0),
      delivery_charge: parseNumber(deliveryChargeValue || root.getAttribute('data-delivery-charge') || '0', 0),
      discount: parseNumber(discountValue || root.getAttribute('data-discount') || '0', 0)
    };
  }

  function sendPartial(root, options) {
    if (!root || _orderDone) return;
    options = options || {};
    var d = getFormData(root);
    if (!d.customer_phone) return;
    var key = JSON.stringify(d);
    if (!options.force && !options.allowRepeat && key === _lastSent) return;
    _lastSent = key;

    postJson(Object.assign({}, d, {
      action: 'save_partial',
      landing_page_slug: SLUG,
      visitor_id: VID
    }), { forceFetch: !!options.forceFetch });
  }

  function queuePartial(target, delay) {
    if (_orderDone) return;
    var root = resolveRoot(target);
    if (!root) return;
    ensureAutosave();
    if (_partialTimer) clearTimeout(_partialTimer);
    _partialTimer = setTimeout(function(){ sendPartial(root); }, delay);
  }

  document.addEventListener('input', function(e) {
    queuePartial(e.target, 1200);
  }, true);

  document.addEventListener('change', function(e) {
    queuePartial(e.target, 300);
  }, true);

  document.addEventListener('focusout', function(e) {
    queuePartial(e.target, 200);
  }, true);

  document.addEventListener('submit', function(e) {
    if (_orderDone) return;
    // Don't send partial on submit — the order handler will take over
  }, true);

  function flushAll() {
    if (_orderDone) return;
    var now = Date.now();
    if ((now - _lastFlushAt) < 1500) return;
    _lastFlushAt = now;
    if (_partialTimer) { clearTimeout(_partialTimer); _partialTimer = null; }
    var roots = getCandidateRoots();
    for (var i = 0; i < roots.length; i++) sendPartial(roots[i], { force: true, forceFetch: true });
  }

  window.addEventListener('beforeunload', flushAll);
  window.addEventListener('unload', flushAll);
  window.addEventListener('pagehide', flushAll);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') flushAll();
  });

  window._removePartial = function() {
    _orderDone = true;
    if (_partialTimer) { clearTimeout(_partialTimer); _partialTimer = null; }
    if (_autosaveTimer) { clearInterval(_autosaveTimer); _autosaveTimer = null; }
    postJson({
      action: 'remove_partial',
      landing_page_slug: SLUG,
      visitor_id: VID
    });
  };
})();
</script>`;

    // Enhanced order submission with rich Purchase event
    const orderScript = `
<script>
(function(){
  var ORDER_URL = '${supabaseUrl}/functions/v1/submit-landing-order';
  var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid') || '';
  var _submitting = false;

  function sendPurchaseFallback(eventId, payload, data, totalValue) {
    try {
      fetch(CAPI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON },
        keepalive: true,
        body: JSON.stringify({
          event_name: 'Purchase',
          event_id: eventId,
          event_url: window.location.href,
          landing_page_slug: SLUG,
          fbp: payload.fbp || (window._lpTrack ? window._lpTrack.getFbp() : ''),
          fbc: payload.fbc || (window._lpTrack ? window._lpTrack.getFbc() : ''),
          user_external_id: data.order_id || data.order_number || '',
          user_phone: payload.customer_phone || '',
          user_fn: payload.customer_name ? String(payload.customer_name).split(/\s+/)[0] : '',
          user_ln: payload.customer_name ? String(payload.customer_name).split(/\s+/).slice(1).join(' ') : '',
          custom_data: {
            value: totalValue,
            currency: 'BDT',
            content_name: payload.product_name || document.title || '',
            content_ids: payload.product_code ? [payload.product_code] : [],
            content_type: 'product',
            num_items: payload.quantity || 1,
            order_id: data.order_number || '',
            subtotal: totalValue
          }
        })
      }).then(function(){
        console.log('[LP-CHECKOUT] Purchase fallback CAPI sent', { eventId: eventId, order: data.order_number });
      }).catch(function(err){
        console.warn('[LP-CHECKOUT] Purchase fallback CAPI failed', err && err.message ? err.message : err);
      });
    } catch(err) {
      console.warn('[LP-CHECKOUT] Purchase fallback CAPI exception', err && err.message ? err.message : err);
    }
  }

  function buildSuccessUrl(result, payload, form, msg) {
    var params = new URLSearchParams();
    var qty = parseInt(payload.quantity || '1', 10);
    if (!isFinite(qty) || qty < 1) qty = 1;
    var unitPrice = parseFloat(payload.unit_price || '0');
    if (!isFinite(unitPrice) || unitPrice < 0) unitPrice = 0;
    var totalValue = parseFloat(payload.total_value || String(unitPrice * qty));
    if (!isFinite(totalValue) || totalValue < 0) totalValue = unitPrice * qty;
    params.set('order', String(result.order_number || ''));
    params.set('eid', String(payload.event_id || ''));
    params.set('value', String(totalValue));
    params.set('qty', String(qty));
    if (payload.product_name) params.set('product', String(payload.product_name));
    if (payload.product_code) params.set('code', String(payload.product_code));
    if (result.order_id) params.set('oid', String(result.order_id));
    if (msg) params.set('msg', msg);
    if (result.duplicate) params.set('duplicate', '1');
    return window.location.origin + '/lp/' + encodeURIComponent(SLUG) + '/success?' + params.toString();
  }

  if (!window.__lpOrderFetchPatched) {
    window.__lpOrderFetchPatched = true;
    var _lpOrigFetch = window.fetch;
    window.fetch = function(input, init) {
      var url = String(typeof input === 'string' ? input : (input && input.url) || '');
      var nextInit = init || {};
      var enrichedPayload = null;
      if (url.indexOf('submit-landing-order') !== -1 && nextInit && nextInit.body) {
        try {
          enrichedPayload = JSON.parse(nextInit.body);
          if (!enrichedPayload.landing_page_slug) enrichedPayload.landing_page_slug = SLUG;
          if (!enrichedPayload.event_id) enrichedPayload.event_id = window._lpTrack ? window._lpTrack.generateEventId() : ('eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now());
          if (!enrichedPayload.event_url) enrichedPayload.event_url = window.location.href;
          if (!enrichedPayload.visitor_id) enrichedPayload.visitor_id = VID;
          if (!enrichedPayload.fbp && window._lpTrack) enrichedPayload.fbp = window._lpTrack.getFbp();
          if (!enrichedPayload.fbc && window._lpTrack) enrichedPayload.fbc = window._lpTrack.getFbc();
          nextInit = Object.assign({}, nextInit, {
            headers: Object.assign({}, nextInit.headers || {}, { apikey: ANON, 'Content-Type': 'application/json' }),
            body: JSON.stringify(enrichedPayload)
          });
        } catch(e) {}
      }
      var response = _lpOrigFetch.call(this, input, nextInit);
      if (url.indexOf('submit-landing-order') !== -1) {
        response.then(function(res) {
          return res.clone().json().then(function(data) {
            if (!data || (!data.success && !data.duplicate) || window.__lpOrderRedirecting) return;
            var payload = enrichedPayload || {};
            var msg = 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + (data.order_number || '');
            var redirectUrl = buildSuccessUrl(data, payload, null, msg);
            try {
              sessionStorage.setItem('_lp_purchase_success:' + String(payload.event_id || ''), JSON.stringify({
                customer_name: payload.customer_name || '',
                customer_phone: payload.customer_phone || '',
                product_name: payload.product_name || '',
                product_code: payload.product_code || '',
                quantity: parseInt(payload.quantity || '1', 10) || 1,
                unit_price: parseFloat(payload.unit_price || '0') || 0,
                total_value: (parseFloat(payload.unit_price || '0') || 0) * (parseInt(payload.quantity || '1', 10) || 1),
                order_id: data.order_id || '',
                order_number: data.order_number || '',
                duplicate: !!data.duplicate
              }));
            } catch(e) {}
            if (!data.duplicate && !data.purchase_tracked) {
              sendPurchaseFallback(String(payload.event_id || ''), payload, data, (parseFloat(payload.unit_price || '0') || 0) * (parseInt(payload.quantity || '1', 10) || 1));
            }
            window.__lpOrderRedirecting = true;
            setTimeout(function() { window.location.href = redirectUrl; }, 120);
          }).catch(function(){});
        }).catch(function(){});
      }
      return response;
    };
  }

  document.addEventListener('submit', function(e) {
    if (e.defaultPrevented) return;
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    if (form.dataset.lpSubmitLocked === '1' || _submitting) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    _submitting = true;
    form.dataset.lpSubmitLocked = '1';

    var btn = form.querySelector('[type="submit"], button:not([type])');
    var btnOrigText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...'; }

    var formData = new FormData(form);
    var purchaseEventId = window._lpTrack ? window._lpTrack.generateEventId() : 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now();
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
      visitor_id: VID,
      event_id: purchaseEventId,
      event_url: window.location.href,
      fbp: window._lpTrack ? window._lpTrack.getFbp() : '',
      fbc: window._lpTrack ? window._lpTrack.getFbc() : ''
    };

    fetch(ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON },
      body: JSON.stringify(payload)
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.success || data.duplicate) {
        // Remove partial incomplete order on success
        if (window._removePartial) window._removePartial();

        var totalValue = payload.unit_price * payload.quantity;
        var eventId = payload.event_id || purchaseEventId;
        var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};

        if (!data.duplicate) {
          var purchaseParams = {
            value: totalValue,
            currency: 'BDT',
            content_name: payload.product_name || document.title || '',
            content_ids: payload.product_code ? [payload.product_code] : [],
            content_type: 'product',
            num_items: payload.quantity || 1,
            order_id: data.order_number,
            subtotal: totalValue
          };

          if (typeof fbq === 'function') {
            fbq('track', 'Purchase', purchaseParams, {eventID: eventId});
            console.log('[LP-CHECKOUT] Browser Purchase fired before redirect', { eventId: eventId, order: data.order_number, value: totalValue });
          } else {
            console.warn('[LP-CHECKOUT] Browser Purchase skipped: fbq unavailable before redirect');
          }

          if (window._lpTrack) {
            window._lpTrack.sendServerEvent('Purchase', Object.assign({ event_id: eventId }, purchaseParams), {
              phone: payload.customer_phone,
              name: payload.customer_name,
              order_id: data.order_id || data.order_number
            });
            console.log('[LP-CHECKOUT] Server Purchase queued before redirect', { eventId: eventId, order: data.order_number });
          }

          if (!data.purchase_tracked) {
            sendPurchaseFallback(eventId, payload, data, totalValue);
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
        }

        var msg = form.getAttribute('data-success-message') || 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + data.order_number;
        var successUrl = buildSuccessUrl(data, payload, form, msg);
        try {
          sessionStorage.setItem('_lp_purchase_success:' + eventId, JSON.stringify({
            customer_name: payload.customer_name,
            customer_phone: payload.customer_phone,
            product_name: payload.product_name || '',
            product_code: payload.product_code || '',
            quantity: payload.quantity || 1,
            unit_price: payload.unit_price || 0,
            total_value: totalValue,
            order_id: data.order_id || '',
            order_number: data.order_number || '',
            duplicate: !!data.duplicate
          }));
        } catch(e) {}
        if (btn) { btn.disabled = true; btn.textContent = '✓ অর্ডার সফল!'; btn.style.backgroundColor = '#10b981'; }
        setTimeout(function() {
          window.location.href = successUrl;
        }, 300);
      } else {
        alert(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে');
        _submitting = false;
        delete form.dataset.lpSubmitLocked;
        if (btn) { btn.disabled = false; btn.textContent = btnOrigText || 'অর্ডার করুন'; }
      }
    })
    .catch(function(err) {
      alert('ত্রুটি: ' + err.message);
      _submitting = false;
      delete form.dataset.lpSubmitLocked;
      if (btn) { btn.disabled = false; btn.textContent = btnOrigText || 'অর্ডার করুন'; }
    });
  }, true);
})();
</script>`;

    const phoneValidationScript = landingPhoneValidationScript;

    // Autocomplete enhancement script
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

    const tierPricePatchScript = `
<script>
(function(){
  function patchSync(){
    if(typeof syncTierToCheckout==='function'){
      var orig=syncTierToCheckout;
      syncTierToCheckout=function(){
        orig.apply(this,arguments);
        var hp=document.getElementById('headerPrice');
        var sum=document.getElementById('sumProduct');
        if(!hp&&sum){
          var priceSpans=document.querySelectorAll('[style*="font-size:22px"][style*="font-weight:800"]');
          for(var i=0;i<priceSpans.length;i++){
            if(priceSpans[i].textContent.indexOf('৳')===0){hp=priceSpans[i];break;}
          }
        }
        if(hp&&sum) hp.textContent=sum.textContent;
      };
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){setTimeout(patchSync,500);});
  else setTimeout(patchSync,500);
})();
</script>
`;

    const resourceHints = `
<link rel="dns-prefetch" href="https://connect.facebook.net" />
<link rel="preconnect" href="https://connect.facebook.net" crossorigin />
${page.tiktok_pixel_id ? '<link rel="dns-prefetch" href="https://analytics.tiktok.com" />' : ''}
${page.gtm_id ? '<link rel="dns-prefetch" href="https://www.googletagmanager.com" />' : ''}
`;

    // Critical scripts in head, deferred in body
    const headScripts = resourceHints + richTrackingHelper + trackingScripts;
    const bodyScripts = landingDeferredScriptLoader + deferredPixelScripts + phoneValidationScript + orderScript + tierPricePatchScript + partialTrackingScript + autocompleteScript;

    const duplicateMarketingPatterns = [
      ...(page.fb_pixel_id ? [/connect\.facebook\.net/i] : []),
      ...(page.tiktok_pixel_id ? [/analytics\.tiktok\.com/i] : []),
      ...(page.gtm_id ? [/googletagmanager\.com/i, /google-analytics\.com/i, /gtag\/js/i] : []),
    ];

    let cleanHtml = sanitizeHtmlScripts(page.checkout_html!);
    cleanHtml = deferLandingMarkupScripts(cleanHtml, { disablePatterns: duplicateMarketingPatterns });
    cleanHtml = normalizeLandingPhoneHtml(cleanHtml);
    cleanHtml = optimizeLandingImages(cleanHtml);
    cleanHtml = optimizeLandingEmbeds(cleanHtml);

    if (cleanHtml.includes("</head>") && cleanHtml.includes("</body>")) {
      return cleanHtml
        .replace("</head>", `${headScripts}</head>`)
        .replace("</body>", `${bodyScripts}</body>`);
    }

    if (cleanHtml.includes("</head>")) {
      return cleanHtml.replace("</head>", `${headScripts}</head>`) + bodyScripts;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${headScripts}</head><body>${cleanHtml}${bodyScripts}</body></html>`;
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
