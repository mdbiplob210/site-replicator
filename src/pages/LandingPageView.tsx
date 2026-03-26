import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useLayoutEffect, useRef } from "react";
import { deferLandingMarkupScripts, landingDeferredScriptLoader, optimizeLandingEmbeds, optimizeLandingImages, sanitizeHtmlScripts } from "@/lib/htmlSanitizer";
import { landingPhoneValidationScript, normalizeLandingPhoneHtml } from "@/lib/landingPhoneHtml";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLandingPageBySlug(slug || "");
  const renderedPageRef = useRef<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  const buildFullHtml = () => {
    if (!page) return '<!DOCTYPE html><html><body></body></html>';
    let trackingScripts = "";
    let deferredPixelScripts = ""; // TikTok, GTM — not needed for FCP
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
  // Send server-side event via Conversions API (with per-page slug for token lookup)
  // Stored user data for advanced matching
  _userData: {},
  setUserData: function(data) {
    this._userData = Object.assign(this._userData || {}, data);
    try { sessionStorage.setItem('_lp_fb_ud', JSON.stringify(this._userData)); } catch(e) {}
  },
  getUserData: function() {
    if (this._userData && Object.keys(this._userData).length > 0) return this._userData;
    try { var d = sessionStorage.getItem('_lp_fb_ud'); if (d) { this._userData = JSON.parse(d); return this._userData; } } catch(e) {}
    return {};
  },
  normalizePhone: function(ph) {
    if (!ph) return '';
    var cleaned = ph.replace(/[^0-9]/g, '');
    if (cleaned.indexOf('0') === 0) cleaned = '880' + cleaned.substring(1);
    if (cleaned.indexOf('880') !== 0 && cleaned.length === 10) cleaned = '880' + cleaned;
    return cleaned;
  },
  sendServerEvent: function(eventName, customData, userData) {
    var CAPI_URL = '${supabaseUrl}/functions/v1/fb-conversions-api';
    var ANON = '${anonKey}';
    var extId; try { extId = localStorage.getItem('_vid'); } catch(e) {}
    if (!extId) { extId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2,12); try { localStorage.setItem('_vid', extId); } catch(e) {} }
    
    // Merge stored + provided user data
    var ud = Object.assign({}, this.getUserData(), userData || {});
    
    var payload = {
      pixel_id: '${page.fb_pixel_id || ''}',
      event_name: eventName,
      event_id: customData.event_id || this.generateEventId(),
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: this.getFbp(),
      fbc: this.getFbc(),
      user_external_id: ud.order_id || extId,
      custom_data: customData,
      landing_page_slug: '${page.slug || ''}',
      user_country: 'bd'
    };
    // Add user PII (will be hashed server-side)
    if (ud.phone) payload.user_phone = this.normalizePhone(ud.phone);
    if (ud.name) {
      var parts = ud.name.trim().split(/\\s+/);
      payload.user_fn = parts[0] || '';
      payload.user_ln = parts.slice(1).join(' ') || '';
    }
    if (ud.city) payload.user_ct = ud.city;
    if (ud.email) payload.user_email = ud.email;
    try {
      fetch(CAPI_URL, {method:'POST', headers:{'Content-Type':'application/json','apikey':ANON}, body:JSON.stringify(payload), keepalive:true, credentials:'omit'}).catch(function(){});
    } catch(e) {
      try { var blob = new Blob([JSON.stringify(payload)], {type: 'text/plain'}); navigator.sendBeacon(CAPI_URL + '?apikey=' + ANON, blob); } catch(e2) {}
    }
  }
};
</script>
`;

    if (page.fb_pixel_id) {
      trackingScripts += `
<!-- Facebook Pixel with Advanced Matching (async, non-blocking) -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
var _extId;
try { _extId = localStorage.getItem('_vid'); } catch(e) {}
if (!_extId) { _extId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2,12); try { localStorage.setItem('_vid', _extId); } catch(e) {} }

fbq('init','${page.fb_pixel_id}', { external_id: _extId, country: 'bd' });

window._fbPixelId = '${page.fb_pixel_id}';
window._updateFBAdvancedMatching = function(data) {
  if (!data || !window._fbPixelId) return;
  var ud = window._lpTrack ? window._lpTrack.getUserData() : {};
  if (data.phone) ud.phone = data.phone;
  if (data.name) ud.name = data.name;
  if (data.city) ud.city = data.city;
  if (window._lpTrack) window._lpTrack.setUserData(ud);
  var initParams = { external_id: _extId, country: 'bd' };
  if (ud.phone) {
    var ph = ud.phone.replace(/[^0-9]/g, '');
    if (ph.indexOf('0') === 0) ph = '880' + ph.substring(1);
    initParams.ph = ph;
  }
  if (ud.name) {
    var parts = ud.name.trim().split(/\\s+/);
    initParams.fn = (parts[0] || '').toLowerCase();
    initParams.ln = (parts.slice(1).join(' ') || '').toLowerCase();
  }
  if (ud.city) initParams.ct = ud.city.toLowerCase();
  fbq('init', window._fbPixelId, initParams);
};

// Inline minimal eventId — no dependency on _lpTrack for head PageView
var _eid = 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now();
fbq('track','PageView', {}, {eventID: _eid});
window._lpPageViewEventId = _eid;

// CAPI PageView deferred — fires when _lpTrack loads in body
// Form field listener also deferred to DOMContentLoaded (body scripts handle it)
</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${page.fb_pixel_id}&ev=PageView&noscript=1"/></noscript>
`;
    }

    if (page.tiktok_pixel_id) {
      deferredPixelScripts += `
<!-- TikTok Pixel (deferred) -->
<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
ttq.load('${page.tiktok_pixel_id}');
ttq.page();
}(window,document,'ttq');
</script>
`;
    }

    if (page.gtm_id) {
      deferredPixelScripts += `
<!-- GTM (deferred) -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${page.gtm_id}');</script>
`;
    }

    if (page.custom_head_scripts) {
      deferredPixelScripts += `\n${page.custom_head_scripts}\n`;
    }

    // Enhanced conversion tracking with rich params + auto-fire checkout funnel events
    const conversionScript = `
<!-- Enhanced Conversion Tracking (All FB Standard Events) -->
<script>
(function(){
  var _firedEvents = {};

  function fireOnce(key, fn) {
    if (_firedEvents[key]) return;
    _firedEvents[key] = true;
    fn();
  }

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
      var ttMap = {Purchase:'CompletePayment',AddToCart:'AddToCart',Lead:'SubmitForm',InitiateCheckout:'InitiateCheckout',ViewContent:'ViewContent',CompleteRegistration:'CompleteRegistration',Contact:'Contact',Search:'Search',AddPaymentInfo:'AddPaymentInfo',AddToWishlist:'AddToWishlist',Subscribe:'Subscribe',FindLocation:'FindLocation',Schedule:'Schedule',CustomizeProduct:'CustomizeProduct',StartTrial:'StartTrial',SubmitApplication:'SubmitApplication',Donate:'Donate'};
      var ttEvent = ttMap[event] || event;
      var ttParams = {value: value, currency: currency, content_type: contentType};
      if (contentName) ttParams.content_name = contentName;
      if (contentId) ttParams.content_id = contentId;
      if (categoryName) ttParams.content_category = categoryName;
      ttParams.quantity = numItems;
      ttq.track(ttEvent, ttParams);
      console.log('[TikTok]', ttEvent, ttParams);
    }

    // GTM dataLayer
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

  // Helper: fire a standard event programmatically
  function fireStandardEvent(eventName, params) {
    params = params || {};
    var eventId = window._lpTrack ? window._lpTrack.generateEventId() : '';
    var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};
    var value = params.value || 0;
    var currency = params.currency || 'BDT';
    var contentName = params.content_name || document.title || '';
    var contentId = params.content_id || '';

    if (typeof fbq === 'function') {
      var fbP = Object.assign({}, params, {
        value: value, currency: currency,
        event_day: baseParams.event_day, event_hour: baseParams.event_hour,
        event_month: baseParams.event_month, traffic_source: baseParams.traffic_source,
        landing_page: baseParams.landing_page, page_title: baseParams.page_title,
        user_role: 'guest', plugin: 'LovableLP'
      });
      fbq('track', eventName, fbP, {eventID: eventId});
      console.log('[FB Pixel Auto]', eventName, fbP);
    }
    if (window._lpTrack && '${page.fb_pixel_id}') {
      window._lpTrack.sendServerEvent(eventName, Object.assign({event_id: eventId}, params));
    }
    if (typeof ttq !== 'undefined' && ttq.track) {
      var ttMap = {Purchase:'CompletePayment',AddToCart:'AddToCart',Lead:'SubmitForm',InitiateCheckout:'InitiateCheckout',ViewContent:'ViewContent',Contact:'Contact',Search:'Search',AddPaymentInfo:'AddPaymentInfo',CompleteRegistration:'CompleteRegistration',AddToWishlist:'AddToWishlist',Subscribe:'Subscribe',FindLocation:'FindLocation',Schedule:'Schedule',CustomizeProduct:'CustomizeProduct',StartTrial:'StartTrial',SubmitApplication:'SubmitApplication',Donate:'Donate'};
      ttq.track(ttMap[eventName] || eventName, {value:value,currency:currency,content_name:contentName});
    }
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push(Object.assign({event:'conversion_'+eventName}, params));
    }
  }

  // Expose for template scripts
  window._fireStandardEvent = fireStandardEvent;

  // Auto-fire ViewContent with rich params (fires even without data-track-view-content)
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof fbq !== 'function') return;
    var vc = document.querySelector('[data-track-view-content]');
    var eventId = window._lpTrack ? window._lpTrack.generateEventId() : 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now();
    var baseParams = window._lpTrack ? window._lpTrack.getBaseParams() : {};
    var vcParams = {
      content_name: vc ? (vc.getAttribute('data-content-name') || document.title) : document.title,
      content_ids: vc && vc.getAttribute('data-content-id') ? [vc.getAttribute('data-content-id')] : [],
      content_type: vc ? (vc.getAttribute('data-content-type') || 'product') : 'product',
      content_category: vc ? (vc.getAttribute('data-content-category') || '') : '',
      value: parseFloat(vc ? (vc.getAttribute('data-content-value') || '0') : '0'),
      currency: vc ? (vc.getAttribute('data-content-currency') || 'BDT') : 'BDT',
      event_day: baseParams.event_day, event_hour: baseParams.event_hour,
      event_month: baseParams.event_month, traffic_source: baseParams.traffic_source,
      landing_page: baseParams.landing_page, page_title: baseParams.page_title,
      user_role: 'guest', plugin: 'LovableLP'
    };
    fireOnce('auto_viewcontent', function() {
      fbq('track', 'ViewContent', vcParams, {eventID: eventId});
      if (window._lpTrack) window._lpTrack.sendServerEvent('ViewContent', {event_id: eventId, ...vcParams});
      if (typeof ttq !== 'undefined' && ttq.track) ttq.track('ViewContent', {content_name: vcParams.content_name, value: vcParams.value, currency: vcParams.currency});
    });

    // ── Helper: read current dynamic price & qty from form ──
    function getCurrentProductData(form) {
      var pName = (form.getAttribute('data-product-name') || document.title || '').substring(0, 150);
      var pCode = form.getAttribute('data-product-code') || '';
      // Read unit_price from hidden input first (updated by tier selector), then data attribute
      var priceInput = form.querySelector('input[name="unit_price"], [data-unit-price]');
      var pPrice = 0;
      if (priceInput && priceInput.tagName === 'INPUT') pPrice = parseFloat(priceInput.value || '0');
      if (!pPrice) pPrice = parseFloat(form.getAttribute('data-unit-price') || '0');
      // Read quantity from input/select (updated by tier selector), then data attribute
      var qtyInput = form.querySelector('input[name="quantity"], select[name="quantity"], [data-quantity]');
      var qty = 1;
      if (qtyInput && (qtyInput.tagName === 'INPUT' || qtyInput.tagName === 'SELECT')) qty = parseInt(qtyInput.value || '1') || 1;
      if (qty <= 0) qty = parseInt(form.getAttribute('data-quantity') || '1') || 1;
      return { name: pName, code: pCode, price: pPrice, qty: qty, total: pPrice * qty };
    }

    // ── Auto-fire AddToCart when user scrolls to checkout form ──
    var checkoutRoot = document.querySelector('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
    if (checkoutRoot) {
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            fireOnce('auto_addtocart', function() {
              var pd = getCurrentProductData(checkoutRoot);
              fireStandardEvent('AddToCart', {
                value: pd.total, currency: 'BDT',
                content_name: pd.name, content_ids: pd.code ? [pd.code] : [],
                content_type: 'product', num_items: pd.qty
              });
            });
            obs.disconnect();
          }
        });
      }, {threshold: 0.3});
      obs.observe(checkoutRoot);
    }

    // ── Auto-fire InitiateCheckout when user starts filling form ──
    document.addEventListener('input', function(e) {
      if (!e.target || !e.target.closest) return;
      var form = e.target.closest('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
      if (!form) return;
      fireOnce('auto_initiatecheckout', function() {
        var pd = getCurrentProductData(form);
        fireStandardEvent('InitiateCheckout', {
          value: pd.total, currency: 'BDT',
          content_name: pd.name, content_ids: pd.code ? [pd.code] : [],
          content_type: 'product', num_items: pd.qty
        });
      });
    }, true);

    // ── Auto-fire Lead when phone number is entered + capture for advanced matching ──
    document.addEventListener('change', function(e) {
      if (!e.target) return;
      var isPhone = (e.target.name === 'customer_phone' || e.target.name === 'phone' || e.target.type === 'tel');
      if (!isPhone) return;
      var val = (e.target.value || '').replace(/[^0-9]/g, '');
      if (val.length >= 10) {
        // Capture phone for advanced matching
        if (window._updateFBAdvancedMatching) {
          var form = e.target.closest('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
          var nameInput = form ? (form.querySelector('input[name="customer_name"],input[name="name"],input[name="full_name"]') || {}) : {};
          window._updateFBAdvancedMatching({ phone: val, name: nameInput.value || '' });
        }
        fireOnce('auto_lead', function() {
          var form = e.target.closest('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
          if (form) {
            var pd = getCurrentProductData(form);
            fireStandardEvent('Lead', {
              value: pd.total, currency: 'BDT', content_name: pd.name,
              content_ids: pd.code ? [pd.code] : [], num_items: pd.qty
            });
          } else {
            fireStandardEvent('Lead', { value: 0, currency: 'BDT', content_name: document.title });
          }
        });
      }
    }, true);

    // ── Auto-fire AddPaymentInfo when address is entered ──
    document.addEventListener('change', function(e) {
      if (!e.target) return;
      var isAddress = (e.target.name === 'customer_address' || e.target.name === 'address' || e.target.name === 'shipping_address');
      if (!isAddress || !(e.target.value || '').trim()) return;
      fireOnce('auto_addpaymentinfo', function() {
        var form = e.target.closest('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
        if (form) {
          var pd = getCurrentProductData(form);
          fireStandardEvent('AddPaymentInfo', {
            value: pd.total, currency: 'BDT', content_name: pd.name, num_items: pd.qty
          });
        } else {
          fireStandardEvent('AddPaymentInfo', { value: 0, currency: 'BDT' });
        }
      });
    }, true);

    // ── Auto-fire Contact on phone/WhatsApp/Messenger link clicks ──
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="tel:"], a[href*="wa.me"], a[href*="m.me"], a[href*="messenger"]');
      if (link) {
        fireOnce('auto_contact_' + link.href.substring(0,30), function() {
          var method = 'unknown';
          if (link.href.indexOf('tel:') === 0) method = 'phone_call';
          else if (link.href.indexOf('wa.me') !== -1) method = 'whatsapp';
          else if (link.href.indexOf('m.me') !== -1 || link.href.indexOf('messenger') !== -1) method = 'messenger';
          fireStandardEvent('Contact', { method: method, page: window.location.href });
        });
      }
    }, true);
  });

  // Click handler for data-track-event
  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-track-event]');
    if (el) fireEvent(el);
  });
})();
</script>
`;

    // Analytics tracking
    const analyticsScript = `
<!-- Landing Page Analytics (Advanced) -->
<script>
(function(){
  var TRACK_URL = '${supabaseUrl}/functions/v1/track-landing-event';
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var VID, SID;
  try { VID = localStorage.getItem('_lp_vid'); } catch(e) {}
  if (!VID) { VID = 'v_' + Math.random().toString(36).substr(2,9) + Date.now(); try { localStorage.setItem('_lp_vid', VID); } catch(e) {} }
  try { SID = sessionStorage.getItem('_lp_sid'); } catch(e) {}
  if (!SID) { SID = 's_' + Math.random().toString(36).substr(2,9) + Date.now(); try { sessionStorage.setItem('_lp_sid', SID); } catch(e) {} }
  var _pageStart = Date.now();
  window._lpLastTrackedClickAt = window._lpLastTrackedClickAt || 0;

  function onReady(cb) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', cb, { once: true });
    else cb();
  }

  function scheduleNonCritical(cb) {
    var raf = window.requestAnimationFrame || function(fn) { setTimeout(fn, 16); };
    var idle = window.requestIdleCallback || function(fn) { setTimeout(fn, 120); };
    onReady(function() { raf(function() { idle(cb); }); });
  }

  // UTM params
  var urlParams = new URLSearchParams(window.location.search);
  var _utm = {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_content: urlParams.get('utm_content') || '',
    utm_term: urlParams.get('utm_term') || ''
  };

  // Device info
  var w = window.innerWidth;
  var _devType = w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

  function postEvent(body) {
    return fetch(TRACK_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+ANON},
      body:body,
      keepalive:true
    }).catch(function(){});
  }

  function sendWithBeacon(body) {
    try {
      if (navigator.sendBeacon) {
        return navigator.sendBeacon(TRACK_URL + '?apikey=' + encodeURIComponent(ANON), new Blob([body], {type:'text/plain'}));
      }
    } catch(e) {}
    return false;
  }

  function send(eventType, eventName, extra) {
    var payload = Object.assign({
      slug: SLUG,
      event_type: eventType,
      event_name: eventName || null,
      visitor_id: VID,
      session_id: SID,
      referrer: document.referrer || null,
      device_type: _devType,
      screen_width: screen.width,
      screen_height: screen.height
    }, _utm, extra || {});
    var body = JSON.stringify(payload);
    if (eventType === 'view') {
      postEvent(body);
      return;
    }
    if (sendWithBeacon(body)) return;
    postEvent(body);
  }
  scheduleNonCritical(function() {
    send('view');

    // Track scroll depth
    var _maxScroll = 0;
    var _scrollSent = {};
    window.addEventListener('scroll', function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
      if (docHeight <= 0) return;
      var pct = Math.round((scrollTop / docHeight) * 100);
      if (pct > _maxScroll) _maxScroll = pct;
      [25, 50, 75, 100].forEach(function(milestone) {
        if (pct >= milestone && !_scrollSent[milestone]) {
          _scrollSent[milestone] = true;
          send('scroll', 'scroll_' + milestone, { scroll_depth: milestone });
        }
      });
    }, { passive: true });

    function sendExit() {
      var timeOnPage = Math.round((Date.now() - _pageStart) / 1000);
      send('exit', null, { scroll_depth: _maxScroll, time_on_page: timeOnPage });
    }

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') sendExit();
    });

    window._lpSend = send;

    document.addEventListener('click', function(e) {
      var clickX = (e.pageX / document.documentElement.scrollWidth * 100).toFixed(2);
      var clickY = (e.pageY / Math.max(document.body.scrollHeight, 1) * 100).toFixed(2);
      var elTag = e.target.tagName || '';
      var elText = (e.target.textContent || '').trim().substring(0,30);
      var clickEl = elTag + (elText ? ':' + elText : '');
      var pageH = document.body.scrollHeight;

      var el = e.target.closest('[data-track-event]');
      if (el) {
        window._lpLastTrackedClickAt = Date.now();
        send('click', el.getAttribute('data-track-event'), { click_x: parseFloat(clickX), click_y: parseFloat(clickY), click_element: clickEl, page_height: pageH });
      } else {
        var clickable = e.target.closest('a, button, [role="button"], input[type="submit"], [onclick], .btn, .order-btn, .checkout-btn');
        if (!clickable) {
          var checkEl = e.target;
          for (var i = 0; i < 3 && checkEl; i++) {
            try {
              var cs = window.getComputedStyle(checkEl);
              if (cs.cursor === 'pointer' && (checkEl.tagName !== 'HTML' && checkEl.tagName !== 'BODY')) { clickable = checkEl; break; }
            } catch(ex) {}
            checkEl = checkEl.parentElement;
          }
        }
        if (clickable) {
          window._lpLastTrackedClickAt = Date.now();
          send('click', (clickable.textContent || '').trim().substring(0, 50), { click_x: parseFloat(clickX), click_y: parseFloat(clickY), click_element: clickEl, page_height: pageH });
        }
      }
    });

    var _funnelFired = {};
    function funnelOnce(step) { if (!_funnelFired[step]) { _funnelFired[step] = true; send('funnel', step); } }

    var form = document.querySelector('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
    if (form) {
      var obs = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting) { funnelOnce('form_view'); obs.disconnect(); }
      }, { threshold: 0.3 });
      obs.observe(form);
    }

    document.addEventListener('input', function(e) {
      if (e.target && e.target.closest && e.target.closest('form, [data-checkout-form], #checkoutForm, #orderForm')) {
        funnelOnce('form_start');
      }
    }, true);

    document.addEventListener('change', function(e) {
      if (!e.target) return;
      var isPhone = (e.target.name === 'customer_phone' || e.target.name === 'phone' || e.target.type === 'tel');
      if (isPhone && (e.target.value || '').replace(/[^0-9]/g,'').length >= 10) funnelOnce('phone_entered');
    }, true);
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
  var dismissed; try { dismissed = sessionStorage.getItem('_exit_dismissed'); } catch(e) {}
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
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var VID; try { VID = localStorage.getItem('_lp_vid'); } catch(e) {} VID = VID || window._LP_VID || '';
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
    var cleaned = String(value == null ? '' : value).replace(/[^\\d.-]/g, '');
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
          sent = navigator.sendBeacon(PARTIAL_URL + '?apikey=' + ANON, new Blob([body], { type: 'text/plain' }));
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
    // IMPORTANT: iterate selectors first, then find nodes per-selector
    // This prevents a node matched by [data-product-name] being read with [name="product_name"] selector
    for (var j = 0; j < selectors.length; j++) {
      var nodes = queryNodes(root, [selectors[j]]);
      for (var i = 0; i < nodes.length; i++) {
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
    var discountValue = readValue(root, fields.discount) || (function(){ try { return sessionStorage.getItem('_exit_discount'); } catch(e) { return '0'; } })() || '0';

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
      visitor_id: VID,
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
    postJson({ action: 'remove_partial', landing_page_slug: SLUG, visitor_id: VID });
  };
})();
</script>`;

    const phoneValidationScript = landingPhoneValidationScript;

    const orderScript = `
<script>
(function(){
  var ORDER_URL = '${supabaseUrl}/functions/v1/submit-landing-order';
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var FORM_SELECTOR = '[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form';
  var VID; try { VID = localStorage.getItem('_lp_vid'); } catch(e) {} VID = VID || '';
  var _submitting = false;

  // Purchase event fires exclusively on the success page (/lp/{slug}/success)
  // No pre-redirect Purchase firing needed — this avoids duplication

  function getTopWindow() {
    try {
      if (window.top && window.top.location && window.top.location.origin === window.location.origin) return window.top;
    } catch(e) {}
    try {
      if (window.parent && window.parent !== window && window.parent.location.origin === window.location.origin) return window.parent;
    } catch(e) {}
    return window;
  }

  function getSuccessSelectors() {
    return [
      '#successMsg',
      '[id*="successMsg"]',
      '[class*="successMsg"]',
      '[class*="success-msg"]',
      '[class*="success-popup"]',
      '[class*="successPopup"]',
      '[class*="success-modal"]',
      '[class*="successModal"]',
      '[class*="confirmation"]',
      '[class*="confirm-popup"]',
      '[class*="confirmPopup"]',
      '[role="dialog"]',
      '[aria-modal="true"]',
      '[class*="modal"]',
      '[class*="popup"]',
      '[class*="overlay"]',
      '#checkoutOverlay',
      '.checkout-overlay'
    ].join(',');
  }

  function suppressLegacySuccessUi() {
    var selectors = getSuccessSelectors();
    try {
      var style = document.getElementById('__lp-success-redirect-style');
      if (!style) {
        style = document.createElement('style');
        style.id = '__lp-success-redirect-style';
        style.textContent = selectors + '{display:none !important;visibility:hidden !important;opacity:0 !important;pointer-events:none !important;}';
        (document.head || document.documentElement).appendChild(style);
      }
    } catch(e) {}

    try {
      document.querySelectorAll(selectors).forEach(function(el) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      });
    } catch(e) {}

    try { document.body.style.overflow = ''; } catch(e) {}
    try { document.documentElement.style.overflow = ''; } catch(e) {}
  }

  function installLegacySuccessObserver() {
    if (window.__lpLegacySuccessObserverInstalled) return;
    window.__lpLegacySuccessObserverInstalled = true;

    var observer = new MutationObserver(function() {
      if (!window.__lpPendingSuccessUrl || window.__lpSuccessNavigationStarted) return;
      try {
        var selectors = getSuccessSelectors();
        var nodes = document.querySelectorAll(selectors);
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          var styles = window.getComputedStyle(node);
          if (styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0') {
            navigateToSuccess(window.__lpPendingSuccessUrl);
            return;
          }
        }
      } catch(e) {}
    });

    try {
      observer.observe(document.documentElement || document.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'open', 'hidden', 'aria-hidden']
      });
    } catch(e) {}
  }

  function resolveTotalValue(payload) {
    var qty = parseInt(payload.quantity || '1', 10);
    if (!isFinite(qty) || qty < 1) qty = 1;
    var unitPrice = parseFloat(payload.unit_price || '0');
    if (!isFinite(unitPrice) || unitPrice < 0) unitPrice = 0;
    var explicitTotal = parseFloat(payload.total_value || '');
    return isFinite(explicitTotal) && explicitTotal >= 0 ? explicitTotal : (unitPrice * qty);
  }

  function persistSuccessState(eventId, payload, result, totalValue) {
    try {
      sessionStorage.setItem('_lp_purchase_success:' + String(eventId || ''), JSON.stringify({
        customer_name: payload.customer_name || '',
        customer_phone: payload.customer_phone || '',
        product_name: payload.product_name || '',
        product_code: payload.product_code || '',
        quantity: parseInt(payload.quantity || '1', 10) || 1,
        unit_price: parseFloat(payload.unit_price || '0') || 0,
        total_value: totalValue,
        order_id: result.order_id || '',
        order_number: result.order_number || '',
        duplicate: !!result.duplicate
      }));
    } catch(e) {}
  }

  function navigateToSuccess(url) {
    if (!url || window.__lpSuccessNavigationStarted) return;
    window.__lpSuccessNavigationStarted = true;
    window.__lpOrderRedirecting = true;
    window.__lpPendingSuccessUrl = url;

    try { window.alert = function(){}; } catch(e) {}
    try { window.confirm = function(){ return true; }; } catch(e) {}

    suppressLegacySuccessUi();

    var targetWindow = getTopWindow();
    var go = function() {
      suppressLegacySuccessUi();
      try {
        targetWindow.location.replace(url);
        return;
      } catch(e) {}
      try {
        targetWindow.location.href = url;
        return;
      } catch(e2) {}
      window.location.href = url;
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(go);
    } else {
      setTimeout(go, 0);
    }
  }

  function handleSuccessfulOrder(result, payload, form, btn, successText) {
    var eventId = payload.event_id || (window._lpTrack ? window._lpTrack.generateEventId() : ('eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now()));
    var totalValue = resolveTotalValue(payload);
    var nextPayload = Object.assign({}, payload, { event_id: eventId, total_value: totalValue });
    var msg = (form && form.getAttribute && form.getAttribute('data-success-message')) || successText || ('আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + (result.order_number || ''));
    var successUrl = buildSuccessUrl(result, nextPayload, form, msg);

    persistSuccessState(eventId, nextPayload, result, totalValue);

    if (btn) {
      btn.disabled = true;
      btn.textContent = '✓ অর্ডার সফল!';
      btn.style.backgroundColor = '#10b981';
    }

    window.__lpPendingSuccessUrl = successUrl;
    navigateToSuccess(successUrl);
  }

  function resetSubmitState(form, btn, btnOrigText) {
    _submitting = false;
    if (form) delete form.dataset.lpSubmitLocked;
    if (btn) {
      btn.disabled = false;
      btn.textContent = btnOrigText || 'অর্ডার করুন';
    }
  }

  function isValidPhone(value) {
    var cleaned = String(value || '').replace(/^[+]?880/, '0').replace(/[^0-9]/g, '');
    // Accept 10 digits (without leading 0) or 11-15 digits
    if (/^[1-9]\d{9}$/.test(cleaned)) return true;
    return /^\d{11,15}$/.test(cleaned);
  }

  function toAsciiDigits(value) {
    var map = {'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
    var input = String(value || '');
    var output = '';
    for (var i = 0; i < input.length; i++) output += map[input.charAt(i)] || input.charAt(i);
    return output;
  }

  function sanitizePhone(value) {
    var input = toAsciiDigits(value);
    var result = '';
    for (var i = 0; i < input.length; i++) {
      var ch = input.charAt(i);
      if (/[0-9]/.test(ch)) result += ch;
      else if (ch === '+' && result.length === 0) result += ch;
    }
    return result;
  }

  function getFieldCandidates(form) {
    if (!form || !form.querySelectorAll) return [];
    var nodes = form.querySelectorAll('input, textarea, select');
    var fields = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var type = (el.getAttribute('type') || '').toLowerCase();
      if (el.disabled) continue;
      if (type === 'hidden' || type === 'radio' || type === 'checkbox' || type === 'submit' || type === 'button') continue;
      fields.push(el);
    }
    return fields;
  }

  function getFieldHint(el) {
    if (!el || !el.getAttribute) return '';
    var parts = [
      el.name || '',
      el.id || '',
      el.placeholder || '',
      el.getAttribute('autocomplete') || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('data-label') || '',
      el.getAttribute('data-name') || '',
      el.getAttribute('type') || '',
      el.getAttribute('inputmode') || ''
    ];
    var prev = el.previousElementSibling;
    if (prev) parts.push((prev.textContent || '').trim());
    var parent = el.parentElement;
    if (parent) parts.push((parent.textContent || '').trim().substring(0, 160));
    return parts.join(' ').toLowerCase();
  }

  function pickField(form, kind) {
    var fields = getFieldCandidates(form);
    if (!fields.length) return null;

    var best = null;
    var bestScore = -999;

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var hint = getFieldHint(field);
      var type = (field.getAttribute('type') || '').toLowerCase();
      var inputmode = (field.getAttribute('inputmode') || '').toLowerCase();
      var autocomplete = (field.getAttribute('autocomplete') || '').toLowerCase();
      var tag = (field.tagName || '').toUpperCase();
      var score = 0;

      if (kind === 'phone') {
        if (/customer_phone|phone|mobile|customer_mobile|contact_number|whatsapp|tel|মোবাইল|ফোন/.test(hint)) score += 40;
        if (/01x|01\\d|[+]880|880/.test(hint)) score += 20;
        if (type === 'tel') score += 18;
        if (inputmode === 'tel') score += 18;
        if (autocomplete === 'tel') score += 14;
        if (sanitizePhone(field.value || field.placeholder || '').length >= 10) score += 10;
        if (field.maxLength && Number(field.maxLength) >= 10 && Number(field.maxLength) <= 15) score += 6;
        if (tag === 'INPUT') score += 2;
        if (i === 1) score += 3;
      }

      if (kind === 'name') {
        if (tag === 'TEXTAREA') score -= 40;
        if (/customer_name|full_name|\bname\b|আপনার নাম|পুরো নাম|নাম/.test(hint)) score += 38;
        if (/phone|mobile|মোবাইল|ফোন|address|ঠিকানা|textarea/.test(hint)) score -= 30;
        if (i === 0) score += 4;
      }

      if (kind === 'address') {
        if (tag === 'TEXTAREA') score += 25;
        if (/customer_address|shipping_address|full_address|address|location|ঠিকানা|এলাকা|জেলা|বাসা|রাস্তা|road/.test(hint)) score += 40;
        if (/phone|mobile|মোবাইল|ফোন|\bname\b|নাম/.test(hint)) score -= 24;
        if (fields.length >= 3 && i === fields.length - 1) score += 4;
      }

      if (score > bestScore) {
        best = field;
        bestScore = score;
      }
    }

    if (best && bestScore > 0) return best;

    if (kind === 'phone') {
      for (var j = 0; j < fields.length; j++) {
        if (sanitizePhone(fields[j].placeholder || '').length >= 10) return fields[j];
      }
      return fields[1] || fields[0] || null;
    }
    if (kind === 'name') return fields[0] || null;
    if (kind === 'address') {
      for (var k = 0; k < fields.length; k++) {
        if ((fields[k].tagName || '').toUpperCase() === 'TEXTAREA') return fields[k];
      }
      return fields[fields.length - 1] || null;
    }

    return null;
  }

  function getCheckoutForm(target) {
    var form = target && target.closest ? target.closest(FORM_SELECTOR) : null;
    if (!form || !form.querySelector) return null;
    var hasPhone = !!pickField(form, 'phone');
    var hasName = !!pickField(form, 'name');
    var hasAnyInputs = form.querySelectorAll('input:not([type="hidden"]), textarea').length >= 2;
    var hasProductHints = form.hasAttribute('data-product-name') || form.hasAttribute('data-product-code') || !!form.querySelector('input[name="product_name"], input[name="product_code"], input[name="unit_price"], input[name="quantity"]');
    return (hasPhone && (hasName || hasProductHints)) || (hasPhone && hasAnyInputs) ? form : null;
  }

  function readField(form, names, types, fallbackIndex) {
    var detectedKind = null;
    if (names && /phone|mobile|contact_number/.test(names.join(' '))) detectedKind = 'phone';
    else if (names && /customer_name|full_name|name/.test(names.join(' '))) detectedKind = 'name';
    else if (names && /address/.test(names.join(' '))) detectedKind = 'address';

    if (detectedKind) {
      var smartField = pickField(form, detectedKind);
      if (smartField && (smartField.value || '').trim()) return (smartField.value || '').trim();
    }

    // Try by name first
    for (var i = 0; i < names.length; i++) {
      var el = form.querySelector('[name="' + names[i] + '"]');
      if (el && (el.value || '').trim()) return el.value.trim();
    }
    // Try by type
    if (types) {
      for (var j = 0; j < types.length; j++) {
        var el2 = form.querySelector(types[j]);
        if (el2 && (el2.value || '').trim()) return el2.value.trim();
      }
    }
    // Fallback: nth input of matching type
    if (typeof fallbackIndex === 'number') {
      var allInputs = form.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), textarea');
      if (allInputs[fallbackIndex]) return (allInputs[fallbackIndex].value || '').trim();
    }
    // Try FormData last
    var fd = new FormData(form);
    for (var k = 0; k < names.length; k++) {
      var v = fd.get(names[k]);
      if (v) return String(v).trim();
    }
    return '';
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

  installLegacySuccessObserver();

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
          if (!enrichedPayload.session_id) {
            try { enrichedPayload.session_id = sessionStorage.getItem('_lp_sid') || ''; } catch(e) { enrichedPayload.session_id = ''; }
          }
          if (!enrichedPayload.device_type) enrichedPayload.device_type = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
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
            handleSuccessfulOrder(data, payload, null, null, 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + (data.order_number || ''));
          }).catch(function(){});
        }).catch(function(){});
      }
      return response;
    };
  }

  function submitOrder(form) {
    if (!form || form.dataset.lpSubmitLocked === '1' || _submitting) return;

    var phoneInput = pickField(form, 'phone');
    var customerPhone = sanitizePhone(readField(form, ['customer_phone','phone','mobile','customer_mobile','contact_number'], ['input[type="tel"]','input[inputmode="tel"]'], null));
    if (!isValidPhone(customerPhone)) {
      alert('অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১১ সংখ্যা)');
      if (phoneInput) phoneInput.focus();
      return;
    }
    if (phoneInput && phoneInput.value !== customerPhone) phoneInput.value = customerPhone;

    _submitting = true;
    form.dataset.lpSubmitLocked = '1';

    var btn = form.querySelector('[type="submit"], button:not([type]), button[type="button"]');
    var btnOrigText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'অপেক্ষা করুন...'; }

    if (window._lpSend && (Date.now() - (window._lpLastTrackedClickAt || 0) > 1500)) {
      window._lpLastTrackedClickAt = Date.now();
      window._lpSend('click', btnOrigText || 'order_submit', {
        click_x: 50,
        click_y: 50,
        click_element: 'FORM_SUBMIT:' + (btnOrigText || 'submit'),
        page_height: document.body.scrollHeight || 0
      });
    }

    var customerName = readField(form, ['customer_name','name','full_name'], ['input[autocomplete="name"]'], 0);
    var customerAddress = readField(form, ['customer_address','address','full_address','shipping_address'], ['textarea', 'input[autocomplete="street-address"]'], null);
    // For textarea without name, try any textarea in form
    if (!customerAddress) {
      var ta = form.querySelector('textarea');
      if (ta) customerAddress = (ta.value || '').trim();
    }

    var purchaseEventId = window._lpTrack ? window._lpTrack.generateEventId() : 'eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now();
    var formData = new FormData(form);
    var payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_address: customerAddress,
      product_name: formData.get('product_name') || form.getAttribute('data-product-name') || document.title || '',
      product_code: formData.get('product_code') || form.getAttribute('data-product-code') || '',
      quantity: parseInt(formData.get('quantity') || form.getAttribute('data-quantity') || '1'),
      unit_price: parseFloat(formData.get('unit_price') || form.getAttribute('data-unit-price') || '0'),
      delivery_charge: parseFloat(formData.get('delivery_charge') || form.getAttribute('data-delivery-charge') || '0'),
      discount: parseFloat(formData.get('discount') || form.getAttribute('data-discount') || '0'),
      notes: formData.get('notes') || '',
      landing_page_slug: SLUG,
      visitor_id: VID,
      session_id: (function(){ try { return sessionStorage.getItem('_lp_sid'); } catch(e) { return ''; } })() || '',
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      event_id: purchaseEventId,
      event_url: window.location.href,
      fbp: window._lpTrack ? window._lpTrack.getFbp() : '',
      fbc: window._lpTrack ? window._lpTrack.getFbc() : ''
    };

    if (window._updateFBAdvancedMatching) {
      window._updateFBAdvancedMatching({ phone: payload.customer_phone, name: payload.customer_name });
    }

    console.log('[LP-DEBUG] Submitting order to:', ORDER_URL, 'payload:', JSON.stringify(payload));
    fetch(ORDER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON },
      body: JSON.stringify(payload)
    })
    .then(function(r) { console.log('[LP-DEBUG] Response status:', r.status); return r.json(); })
    .then(function(data) {
      console.log('[LP-DEBUG] Response data:', JSON.stringify(data));
      if (data.success || data.duplicate) {
        if (window._removePartial) window._removePartial();
        console.log('[LP-DEBUG] Order success, redirecting to success page', { eventId: payload.event_id || purchaseEventId, order: data.order_number, totalValue: resolveTotalValue(payload) });
        handleSuccessfulOrder(data, payload, form, btn, 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + data.order_number);
      } else {
        alert(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে');
        resetSubmitState(form, btn, btnOrigText);
      }
    })
    .catch(function(err) {
      console.error('[LP-DEBUG] Fetch error:', err.message, err);
      alert('ত্রুটি: ' + err.message);
      resetSubmitState(form, btn, btnOrigText);
    });
  }

  // === Aggressive form interception ===
  // 1. Capture-phase listeners (highest priority)
  document.addEventListener('submit', function(e) {
    var form = getCheckoutForm(e.target);
    if (!form) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    submitOrder(form);
  }, true);

  document.addEventListener('click', function(e) {
    if (_submitting) return;
    var btn = e.target && e.target.closest ? e.target.closest('button, [role="button"], input[type="submit"]') : null;
    if (!btn) return;
    var btnText = (btn.textContent || btn.value || '').trim();
    if (!/অর্ডার|order|submit|কনফার্ম|confirm/i.test(btnText)) return;
    var form = getCheckoutForm(btn);
    if (!form) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    submitOrder(form);
  }, true);

  // 2. Direct form patching — override submit and button clicks on any checkout form
  function patchForm(form) {
    if (!form || form.__lpPatched) return;
    var detected = getCheckoutForm(form);
    if (!detected) {
      // Also try treating ANY form with 2+ inputs as checkout
      var inputs = form.querySelectorAll('input:not([type="hidden"]), textarea');
      if (inputs.length < 2) return;
    }
    form.__lpPatched = true;

    // Override native submit
    var origSubmit = form.submit;
    form.submit = function() {
      var checkout = getCheckoutForm(form);
      if (checkout) { submitOrder(checkout); return; }
      origSubmit.call(form);
    };

    // Override onsubmit
    form.onsubmit = function(e) {
      e && e.preventDefault && e.preventDefault();
      var checkout = getCheckoutForm(form);
      if (checkout) { submitOrder(checkout); return false; }
      return true;
    };

    // Patch all buttons in form
    var buttons = form.querySelectorAll('button, [role="button"], input[type="submit"]');
    for (var i = 0; i < buttons.length; i++) {
      (function(btn) {
        if (btn.__lpPatched) return;
        btn.__lpPatched = true;
        var origClick = btn.onclick;
        btn.onclick = function(e) {
          var btnText = (btn.textContent || btn.value || '').trim();
          if (/অর্ডার|order|submit|কনফার্ম|confirm/i.test(btnText)) {
            e && e.preventDefault && e.preventDefault();
            e && e.stopImmediatePropagation && e.stopImmediatePropagation();
            var checkout = getCheckoutForm(btn) || getCheckoutForm(form);
            if (checkout) { submitOrder(checkout); return false; }
          }
          if (origClick) return origClick.call(btn, e);
        };
      })(buttons[i]);
    }
  }

  // 3. MutationObserver — patch forms as they appear
  function scanAndPatchForms() {
    var forms = document.querySelectorAll(FORM_SELECTOR);
    for (var i = 0; i < forms.length; i++) patchForm(forms[i]);
  }

  scanAndPatchForms();

  if (typeof MutationObserver !== 'undefined') {
    var formObserver = new MutationObserver(function() { scanAndPatchForms(); });
    formObserver.observe(document.documentElement || document.body, { subtree: true, childList: true });
  }

  // 4. Periodic scan fallback for dynamically created popups
  var _scanInterval = setInterval(function() { scanAndPatchForms(); }, 1000);
  setTimeout(function() { clearInterval(_scanInterval); }, 60000);
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

    // Inject globals FIRST so template's embedded handler can use them
    const globalsScript = `
<script>
window.SUPABASE_URL = '${supabaseUrl}';
window.SUPABASE_ANON_KEY = '${anonKey}';
window._LP_SLUG = '${page.slug}';
try { window._LP_VID = localStorage.getItem('_lp_vid') || ''; } catch(e) { window._LP_VID = ''; }
if (!window._LP_VID) { window._LP_VID = 'v_' + Math.random().toString(36).substr(2,9) + Date.now(); try { localStorage.setItem('_lp_vid', window._LP_VID); } catch(e) {} }
</script>
`;

    // ═══ Admin Debug Panel (only shows with ?debug=1) ═══
    const debugPanelScript = `
<script>
(function(){
  if (!/[?&]debug=1/.test(window.location.search)) return;

  var logs = [];
  var panel, logBox, badge;

  function addLog(category, msg, status) {
    var ts = new Date().toLocaleTimeString('en',{hour12:false});
    var colors = {ok:'#22c55e',fail:'#ef4444',info:'#3b82f6',warn:'#f59e0b'};
    logs.push({ts:ts,category:category,msg:msg,status:status||'info'});
    if (logBox) {
      var row = document.createElement('div');
      row.style.cssText = 'padding:4px 0;border-bottom:1px solid rgba(255,255,255,.08);font-size:11px;line-height:1.4;word-break:break-all;';
      row.innerHTML = '<span style="color:#888">' + ts + '</span> '
        + '<span style="background:' + (colors[status]||colors.info) + ';color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;margin:0 4px;">' + category.toUpperCase() + '</span> '
        + '<span style="color:' + (colors[status]||'#ccc') + '">' + msg + '</span>';
      logBox.appendChild(row);
      logBox.scrollTop = logBox.scrollHeight;
    }
    if (badge) { badge.textContent = String(logs.length); badge.style.display = 'flex'; }
  }

  // Intercept sendBeacon
  var origBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = function(url, body) {
    var u = String(url);
    if (u.indexOf('track-partial-order') !== -1) {
      try { var d = JSON.parse(typeof body === 'string' ? body : body.text ? '' : new TextDecoder().decode(body.slice ? body.slice(0) : new Uint8Array()));
        addLog('partial', (d.action||'save') + ': ' + (d.customer_name||'-') + ' / ' + (d.customer_phone||'-'), 'ok');
      } catch(e) { addLog('partial', 'Data sent', 'ok'); }
    } else if (u.indexOf('track-landing-event') !== -1) {
      addLog('analytics', 'Event beacon sent', 'ok');
    } else if (u.indexOf('fb-conversions-api') !== -1) {
      addLog('capi', 'Server event sent', 'ok');
    }
    return origBeacon(url, body);
  };

  // Intercept fetch for order submission
  var origFetch = window.fetch;
  window.fetch = function(url) {
    var u = String(typeof url === 'string' ? url : (url && url.url) || '');
    var result = origFetch.apply(this, arguments);
    if (u.indexOf('submit-landing-order') !== -1) {
      addLog('order', 'Submitting order...', 'info');
      result.then(function(r) {
        return r.clone().json().then(function(d) {
          if (d.success) addLog('order', 'Order #' + (d.order_number||'') + ' created', 'ok');
          else addLog('order', 'Failed: ' + (d.error||'unknown'), 'fail');
        });
      }).catch(function(e) { addLog('order', 'Error: ' + e.message, 'fail'); });
    } else if (u.indexOf('track-partial-order') !== -1) {
      addLog('partial', 'Fallback fetch sent', 'ok');
    }
    return result;
  };

  // Intercept fbq
  var origFbq = window.fbq;
  if (typeof origFbq === 'function') {
    window.fbq = function() {
      var args = Array.prototype.slice.call(arguments);
      if (args[0] === 'track' || args[0] === 'trackCustom') {
        addLog('fb pixel', args[1] + (args[2] && args[2].value ? ' (৳' + args[2].value + ')' : ''), 'ok');
      }
      return origFbq.apply(this, arguments);
    };
    // Copy properties
    for (var k in origFbq) { if (origFbq.hasOwnProperty(k)) window.fbq[k] = origFbq[k]; }
    window.fbq.callMethod = origFbq.callMethod;
    window.fbq.queue = origFbq.queue;
    window.fbq.push = origFbq.push;
    window.fbq.loaded = origFbq.loaded;
    window.fbq.version = origFbq.version;
  } else {
    // fbq not loaded yet, watch for it
    addLog('fb pixel', 'Not configured', 'warn');
  }

  // Intercept ttq
  setTimeout(function() {
    if (typeof window.ttq !== 'undefined' && window.ttq.track) {
      var origTT = window.ttq.track;
      window.ttq.track = function() {
        addLog('tiktok', arguments[0] + (arguments[1] && arguments[1].value ? ' (৳' + arguments[1].value + ')' : ''), 'ok');
        return origTT.apply(this, arguments);
      };
    } else {
      addLog('tiktok', 'Not configured', 'warn');
    }
  }, 2000);

  // Build UI
  document.addEventListener('DOMContentLoaded', function() {
    var collapsed = true;

    var fab = document.createElement('div');
    fab.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:999999;';

    var btn = document.createElement('button');
    btn.style.cssText = 'width:44px;height:44px;border-radius:50%;background:#1e293b;border:2px solid #334155;color:#fff;font-size:18px;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;position:relative;';
    btn.innerHTML = '🛠';
    btn.title = 'Debug Panel';

    badge = document.createElement('span');
    badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#22c55e;color:#fff;font-size:9px;font-weight:700;min-width:18px;height:18px;border-radius:9px;display:none;align-items:center;justify-content:center;padding:0 4px;';
    badge.textContent = '0';
    btn.appendChild(badge);

    panel = document.createElement('div');
    panel.style.cssText = 'display:none;position:fixed;bottom:70px;right:16px;width:360px;max-width:calc(100vw - 32px);max-height:50vh;background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);z-index:999999;font-family:ui-monospace,monospace;overflow:hidden;';

    var header = document.createElement('div');
    header.style.cssText = 'padding:10px 14px;background:#1e293b;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #334155;';
    header.innerHTML = '<span style="color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:1px;">🛠 LP DEBUG</span>';

    var checks = document.createElement('div');
    checks.style.cssText = 'padding:8px 14px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #1e293b;';
    var items = [
      ['FB Pixel', ${page.fb_pixel_id ? 'true' : 'false'}],
      ['TikTok', ${page.tiktok_pixel_id ? 'true' : 'false'}],
      ['GTM', ${page.gtm_id ? 'true' : 'false'}],
      ['Partial Track', true],
      ['Order API', true]
    ];
    for (var i = 0; i < items.length; i++) {
      var chip = document.createElement('span');
      chip.style.cssText = 'font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;' + (items[i][1] ? 'background:#052e16;color:#4ade80;' : 'background:#1c1917;color:#78716c;');
      chip.textContent = (items[i][1] ? '✓ ' : '✗ ') + items[i][0];
      checks.appendChild(chip);
    }

    logBox = document.createElement('div');
    logBox.style.cssText = 'padding:8px 14px;overflow-y:auto;max-height:calc(50vh - 100px);';

    panel.appendChild(header);
    panel.appendChild(checks);
    panel.appendChild(logBox);
    fab.appendChild(panel);
    fab.appendChild(btn);
    document.body.appendChild(fab);

    btn.addEventListener('click', function() {
      collapsed = !collapsed;
      panel.style.display = collapsed ? 'none' : 'block';
    });

    addLog('system', 'Debug panel initialized for "${page.slug}"', 'info');
    addLog('system', 'Slug: ${page.slug} | VID: ' + (window._LP_VID || ''), 'info');

    // Detect form presence
    setTimeout(function() {
      var forms = document.querySelectorAll('[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form');
      addLog('form', forms.length + ' checkout root(s) found', forms.length > 0 ? 'ok' : 'warn');
    }, 1000);
  });
})();
</script>
`;

    // Runtime patch: sync header price when tier changes (works on existing pages too)
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

    // Heartbeat script for live visitor tracking — DEFERRED to not block render
    const heartbeatScript = `
<script>
(function(){
  var HB_URL = '${supabaseUrl}/functions/v1/visitor-heartbeat';
  var ANON = '${anonKey}';
  var SLUG = '${page.slug}';
  var VID; try { VID = localStorage.getItem('_lp_vid'); } catch(e) {} VID = VID || '';
  function sendHB() {
    var phone = '';
    try {
      var phoneInput = document.querySelector('input[name="phone"], input[name="customer_phone"], input[type="tel"]');
      if (phoneInput) phone = phoneInput.value.replace(/\\D/g, '');
    } catch(e) {}
    try {
      fetch(HB_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON },
        body: JSON.stringify({ visitor_id: VID, customer_phone: phone || null, page_slug: SLUG }),
        keepalive: true
      });
    } catch(e) {}
  }
  // Defer first heartbeat by 10s to not block initial render
  setTimeout(sendHB, 10000);
  setInterval(sendHB, 30000);
})();
</script>
`;

    // CRITICAL: Only minimal pixel init in <head> for fastest FCP
    // Everything else deferred to body end to unblock rendering
    const resourceHints = `
<link rel="dns-prefetch" href="https://connect.facebook.net" />
<link rel="preconnect" href="https://connect.facebook.net" crossorigin />
${page.tiktok_pixel_id ? '<link rel="dns-prefetch" href="https://analytics.tiktok.com" />' : ''}
${page.gtm_id ? '<link rel="dns-prefetch" href="https://www.googletagmanager.com" />' : ''}
`;
    const headScripts = resourceHints + globalsScript + trackingScripts;

    // ALL other scripts deferred to body end — massive FCP improvement
    // richTrackingHelper now in body too (CAPI PageView fires from here)
    const capiPageViewScript = page.fb_pixel_id ? `
<script>
// Deferred CAPI PageView — fires after _lpTrack loads
if (window._lpTrack && window._lpPageViewEventId) {
  window._lpTrack.sendServerEvent('PageView', {event_id: window._lpPageViewEventId});
}
// Deferred form field listener for advanced matching
var PHONE_SEL = 'input[name="customer_phone"],input[name="phone"],input[name="mobile"],input[type="tel"]';
var NAME_SEL = 'input[name="customer_name"],input[name="name"],input[name="full_name"]';
document.addEventListener('input', function(e) {
  if (!e.target || !e.target.matches) return;
  var data = {};
  if (e.target.matches(PHONE_SEL)) { var val = (e.target.value || '').replace(/[^0-9]/g, ''); if (val.length >= 11) data.phone = val; }
  if (e.target.matches(NAME_SEL)) { var nm = (e.target.value || '').trim(); if (nm.length >= 2) data.name = nm; }
  if (Object.keys(data).length > 0 && window._updateFBAdvancedMatching) window._updateFBAdvancedMatching(data);
}, true);
</script>
` : '';
    const bodyScripts = landingDeferredScriptLoader + richTrackingHelper + capiPageViewScript + deferredPixelScripts + conversionScript + orderScript + phoneValidationScript + tierPricePatchScript + analyticsScript + partialTrackingScript + autocompleteScript + exitIntentScript + debugPanelScript + heartbeatScript;

    const duplicateMarketingPatterns = [
      ...(page.fb_pixel_id ? [/connect\.facebook\.net/i] : []),
      ...(page.tiktok_pixel_id ? [/analytics\.tiktok\.com/i] : []),
      ...(page.gtm_id ? [/googletagmanager\.com/i, /google-analytics\.com/i, /gtag\/js/i] : []),
    ];

    let cleanHtml = sanitizeHtmlScripts(page.html_content);
    cleanHtml = deferLandingMarkupScripts(cleanHtml, { disablePatterns: duplicateMarketingPatterns });
    cleanHtml = normalizeLandingPhoneHtml(cleanHtml);
    cleanHtml = optimizeLandingImages(cleanHtml);
    cleanHtml = optimizeLandingEmbeds(cleanHtml);

    // Inject head scripts into </head> and body scripts before </body>
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

  useLayoutEffect(() => {
    if (!page) return;

    const renderKey = `${page.id}:${page.updated_at}`;
    if (renderedPageRef.current === renderKey) return;

    try {
      const fullHtml = buildFullHtml();
      document.open();
      document.write(fullHtml);
      document.close();
      renderedPageRef.current = renderKey;
    } catch (error) {
      renderedPageRef.current = null;
      console.error("Failed to render landing page", error);
    }
  }, [page]);

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

  // Return empty div — the useEffect above replaces the entire document
  return <div />;
}

