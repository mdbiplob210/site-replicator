import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useLayoutEffect, useRef } from "react";
import { deferLandingMarkupScripts, landingDeferredScriptLoader, optimizeLandingEmbeds, optimizeLandingImages, sanitizeHtmlScripts } from "@/lib/htmlSanitizer";
import { landingPhoneValidationScript, normalizeLandingPhoneHtml } from "@/lib/landingPhoneHtml";

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

type LandingPixelWindow = Window & typeof globalThis & {
  fbq?: ((...args: any[]) => void) & {
    callMethod?: (...args: any[]) => void;
    queue?: any[][];
    loaded?: boolean;
    version?: string;
    push?: (...args: any[]) => number;
  };
  _fbq?: LandingPixelWindow["fbq"];
  _lpPageViewEventId?: string;
  __lpPageViewTracked?: boolean;
  __lpMetaPixelBootstrapped?: Record<string, boolean>;
};

function ensureMetaPixelBootstrap(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;

  const win = window as LandingPixelWindow;
  win.__lpMetaPixelBootstrapped = win.__lpMetaPixelBootstrapped || {};

  if (!win.fbq) {
    const fbq = ((...args: any[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }

      fbq.queue?.push(args);
    }) as NonNullable<LandingPixelWindow["fbq"]>;

    if (!win._fbq) win._fbq = fbq;
    fbq.push = (...args: any[]) => {
      fbq.queue?.push(args);
      return fbq.queue?.length ?? 0;
    };
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    win.fbq = fbq;

    if (!document.querySelector('script[data-lp-meta-pixel-sdk="true"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.dataset.lpMetaPixelSdk = "true";
      document.head.appendChild(script);
    }
  }

  if (win.__lpMetaPixelBootstrapped[pixelId]) return;

  let externalId = "";
  try {
    externalId = localStorage.getItem("_vid") || "";
  } catch (_) {}

  if (!externalId) {
    externalId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
    try {
      localStorage.setItem("_vid", externalId);
    } catch (_) {}
  }

  const eventId = win._lpPageViewEventId || `eid_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  win._lpPageViewEventId = eventId;

  win.fbq?.("init", pixelId, { external_id: externalId, country: "bd" });
  if (!win.__lpPageViewTracked) {
    win.fbq?.("track", "PageView", {}, { eventID: eventId });
    win.__lpPageViewTracked = true;
  }

  win.__lpMetaPixelBootstrapped[pixelId] = true;
}

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLandingPageBySlug(slug || "");
  const renderedPageRef = useRef<string | null>(null);
  const pixelBootstrapRef = useRef<string | null>(null);

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
    
    // Auto-detect city from address for better EMQ
    var detectedCity = ud.city || '';
    if (!detectedCity && ud.address) {
      var addr = (ud.address || '').toLowerCase();
      if (/ঢাকা|dhaka/i.test(addr)) detectedCity = 'dhaka';
      else if (/চট্টগ্রাম|chattogram|chittagong/i.test(addr)) detectedCity = 'chittagong';
      else if (/রাজশাহী|rajshahi/i.test(addr)) detectedCity = 'rajshahi';
      else if (/খুলনা|khulna/i.test(addr)) detectedCity = 'khulna';
      else if (/সিলেট|sylhet/i.test(addr)) detectedCity = 'sylhet';
      else if (/বরিশাল|barishal|barisal/i.test(addr)) detectedCity = 'barishal';
      else if (/রংপুর|rangpur/i.test(addr)) detectedCity = 'rangpur';
      else if (/ময়মনসিংহ|mymensingh/i.test(addr)) detectedCity = 'mymensingh';
      else if (/কুমিল্লা|comilla|cumilla/i.test(addr)) detectedCity = 'cumilla';
      else if (/গাজীপুর|gazipur/i.test(addr)) detectedCity = 'gazipur';
      else if (/নারায়ণগঞ্জ|narayanganj/i.test(addr)) detectedCity = 'narayanganj';
    }

    var payload = {
      pixel_id: '${page.fb_pixel_id || ''}',
      event_name: eventName,
      event_id: customData.event_id || this.generateEventId(),
      event_url: window.location.href,
      user_agent: navigator.userAgent,
      fbp: this.getFbp(),
      fbc: this.getFbc(),
      user_external_id: ud.order_id || extId,
      custom_data: Object.assign({}, customData, {
        content_category: customData.content_category || 'ecommerce',
        delivery_category: customData.delivery_category || ''
      }),
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
    if (detectedCity) { payload.user_ct = detectedCity; payload.user_st = detectedCity; }
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
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;t.onload=function(){window.__lpFbSdkLoaded=!0;if(typeof window.__lpFlushPendingBrowserPurchases==='function'){setTimeout(window.__lpFlushPendingBrowserPurchases,0)}};t.onerror=function(){console.warn('[FB Pixel] SDK failed to load')};s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
var _extId;
try { _extId = localStorage.getItem('_vid'); } catch(e) {}
if (!_extId) { _extId = 'v_' + Date.now() + '_' + Math.random().toString(36).substr(2,12); try { localStorage.setItem('_vid', _extId); } catch(e) {} }

 fbq('init','${page.fb_pixel_id}', { external_id: _extId, country: 'bd' });
 
 window._fbPixelId = '${page.fb_pixel_id}';
 window.__lpPersistPendingBrowserPurchases = function(queue) {
    try { sessionStorage.setItem('_lp_pending_fb_purchases', JSON.stringify(queue || [])); } catch (e) {}
  };
  window.__lpLoadPendingBrowserPurchases = function() {
    try {
      var raw = sessionStorage.getItem('_lp_pending_fb_purchases');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };
  window.__lpPendingBrowserPurchases = window.__lpPendingBrowserPurchases || window.__lpLoadPendingBrowserPurchases();
  window.__lpFiredBrowserPurchases = window.__lpFiredBrowserPurchases || {};
  window.__lpHasBrowserPurchaseFired = function(eventId) {
    if (!eventId) return false;
    if (window.__lpFiredBrowserPurchases[eventId]) return true;
    try { return sessionStorage.getItem('_lp_fired_fb_purchase:' + eventId) === '1'; } catch (e) { return false; }
  };
  window.__lpMarkBrowserPurchaseFired = function(eventId) {
    if (!eventId) return;
    window.__lpFiredBrowserPurchases[eventId] = true;
    try { sessionStorage.setItem('_lp_fired_fb_purchase:' + eventId, '1'); } catch (e) {}
  };
  window.__lpQueueBrowserPurchase = function(params, options) {
    var queue = window.__lpPendingBrowserPurchases || [];
    var eventId = options && options.eventID ? String(options.eventID) : '';
    if (eventId && window.__lpHasBrowserPurchaseFired(eventId)) return true;
    for (var i = 0; i < queue.length; i++) {
      var queued = queue[i];
      if (queued && queued.options && String(queued.options.eventID || '') === eventId) return true;
    }
    queue.push({ params: params || {}, options: options || {} });
    window.__lpPendingBrowserPurchases = queue;
    window.__lpPersistPendingBrowserPurchases(queue);
    return true;
  };
  window.__lpFlushPendingBrowserPurchases = function() {
    var ref = window.fbq || window._fbq || window.__lpFbqRef;
    var ready = !!(ref && typeof ref === 'function' && typeof ref.callMethod === 'function');
    if (!ready) return false;
    window.__lpFbqRef = ref;
    var queue = window.__lpPendingBrowserPurchases || [];
    if (!queue.length) return true;
    var remaining = [];
    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      if (!item) continue;
      var eventId = item.options && item.options.eventID ? String(item.options.eventID) : '';
      if (eventId && window.__lpHasBrowserPurchaseFired(eventId)) continue;
      try {
        ref('track', 'Purchase', item.params || {}, item.options || {});
        if (eventId) window.__lpMarkBrowserPurchaseFired(eventId);
        console.log('[FB Pixel] Purchase event fired via flushed queue', item.params || {}, item.options || {});
      } catch (err) {
        remaining.push(item);
      }
    }
    window.__lpPendingBrowserPurchases = remaining;
    window.__lpPersistPendingBrowserPurchases(remaining);
    return remaining.length === 0;
  };
 window.__lpFbqRef = fbq;
 window.__lpIsFbPixelReady = function() {
    var ref = window.fbq || window._fbq || window.__lpFbqRef;
    return !!(ref && typeof ref === 'function' && typeof ref.callMethod === 'function');
  };
  window.__lpTrackBrowserPurchase = function(params, options) {
    var eventId = options && options.eventID ? String(options.eventID) : '';
    if (eventId && window.__lpHasBrowserPurchaseFired(eventId)) return true;
    window.__lpQueueBrowserPurchase(params, options);
    if (window.__lpFlushPendingBrowserPurchases()) return true;
    if (!window.__lpBrowserPurchaseRetryTimer) {
      var attempts = 0;
      window.__lpBrowserPurchaseRetryTimer = setInterval(function() {
        attempts += 1;
        var drained = window.__lpFlushPendingBrowserPurchases();
        if (drained || attempts >= 40) {
          clearInterval(window.__lpBrowserPurchaseRetryTimer);
          window.__lpBrowserPurchaseRetryTimer = null;
          if (!drained) console.warn('[FB Pixel] Purchase still queued because SDK is not ready yet');
        }
      }, 250);
    }
    return true;
  };
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
      // Add contents array for better EMQ
      vcParams.contents = vcParams.content_ids.length > 0 ? [{id: vcParams.content_ids[0], quantity: 1, item_price: vcParams.value}] : [];
      fbq('track', 'ViewContent', vcParams, {eventID: eventId});
      if (window._lpTrack) window._lpTrack.sendServerEvent('ViewContent', Object.assign({event_id: eventId}, vcParams));
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
  var CHECKOUT_ROOT_SELECTOR = '[data-checkout-form], form, #checkoutForm, #orderForm, .checkout-form, .order-form, .checkout, #checkout, [id*="checkout"], [class*="checkout"], [id*="order"], [class*="order"]';
  var DIRECT_PHONE_SELECTOR = [
    'input[name="customer_phone"]',
    'input[name="phone"]',
    'input[name="mobile"]',
    'input[name="customer_mobile"]',
    'input[name="contact_number"]',
    'input[type="tel"]',
    'input[inputmode="tel"]',
    'input[autocomplete="tel"]',
    'input[id*="phone" i]',
    'input[id*="mobile" i]',
    'input[placeholder*="phone" i]',
    'input[placeholder*="mobile" i]',
    'input[placeholder*="মোবাইল"]',
    'input[placeholder*="ফোন"]',
    'input[type="number"][name*="phone" i]',
    'input[type="number"][name*="mobile" i]',
    'input[type="number"][id*="phone" i]',
    'input[type="number"][id*="mobile" i]'
  ].join(',');
  var VID; try { VID = localStorage.getItem('_lp_vid'); } catch(e) {} VID = VID || '';
  var _submitting = false;

  // Override alert/confirm EARLY to prevent template's success popups
  // We keep a reference for our own validation messages
  var _origAlert = window.alert;
  var _origConfirm = window.confirm;
  var _lpAlertOverridden = false;
  function overrideAlerts() {
    if (_lpAlertOverridden) return;
    _lpAlertOverridden = true;
    window.alert = function(msg) {
      // Allow our own validation alerts through
      if (msg && /সঠিক মোবাইল|ত্রুটি|সমস্যা/.test(String(msg))) {
        return _origAlert.call(window, msg);
      }
      // After order submission, suppress all alerts (template success alerts)
      if (_submitting || window.__lpOrderRedirecting || window.__lpSubmitStarted) {
        console.log('[LP] Suppressed template alert:', msg);
        return;
      }
      return _origAlert.call(window, msg);
    };
    window.confirm = function(msg) {
      if (_submitting || window.__lpOrderRedirecting || window.__lpSubmitStarted) {
        console.log('[LP] Suppressed template confirm:', msg);
        return true;
      }
      return _origConfirm.call(window, msg);
    };
  }
  overrideAlerts();

  // ── Purchase event fires in-page via success popup (no redirect) ──

  function firePurchaseEvent(payload, result) {
    var eventId = payload.event_id || (window._lpTrack ? window._lpTrack.generateEventId() : ('eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now()));
    window.__lpPurchaseEventCache = window.__lpPurchaseEventCache || {};
    if (window.__lpPurchaseEventCache[eventId]) {
      console.log('[Purchase] Duplicate popup purchase skipped', { eventId: eventId, order: result && result.order_number ? result.order_number : '' });
      return;
    }
    window.__lpPurchaseEventCache[eventId] = true;

    var totalValue = resolveTotalValue(payload);
    var purchaseParams = {
      value: totalValue,
      currency: 'BDT',
      content_name: (payload.product_name || document.title || '').substring(0, 150),
      content_ids: payload.product_code ? [payload.product_code] : [],
      contents: payload.product_code ? [{id: payload.product_code, quantity: parseInt(payload.quantity || '1', 10) || 1, item_price: parseFloat(payload.unit_price || '0') || totalValue}] : [],
      content_type: 'product',
      content_category: 'ecommerce',
      num_items: parseInt(payload.quantity || '1', 10) || 1,
      order_id: String(result.order_number || ''),
      subtotal: totalValue
    };

    // Browser pixel Purchase — wait for real FB SDK, not just the queue stub
    var browserPurchaseScheduled = false;
    if (typeof window.__lpTrackBrowserPurchase === 'function') {
      browserPurchaseScheduled = window.__lpTrackBrowserPurchase(purchaseParams, { eventID: eventId });
    } else {
      var directRef = window.fbq || window._fbq;
      if (directRef && typeof directRef === 'function' && typeof directRef.callMethod === 'function') {
        try {
          directRef('track', 'Purchase', purchaseParams, { eventID: eventId });
          browserPurchaseScheduled = true;
          console.log('[Purchase] Direct ready fbq track used');
        } catch (e) {}
      }
    }
    console.log('[Purchase] Browser pixel dispatch attempted', {
      eventId: eventId,
      value: totalValue,
      browserPurchaseScheduled: browserPurchaseScheduled,
      sdkReady: typeof window.__lpIsFbPixelReady === 'function' ? window.__lpIsFbPixelReady() : false
    });

    // TikTok pixel Purchase
    if (typeof ttq !== 'undefined' && ttq.track) {
      ttq.track('CompletePayment', { value: totalValue, currency: 'BDT', content_name: purchaseParams.content_name, quantity: purchaseParams.num_items });
    }

    // GTM dataLayer
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({ event: 'conversion_Purchase', value: totalValue, currency: 'BDT', order_id: result.order_number });
    }

    // Server-side CAPI fallback only if backend purchase tracking did not already succeed
    if (window._lpTrack && result && result.purchase_tracked !== true) {
      // Extract city from address for better EMQ
      var addr = (payload.customer_address || '').toLowerCase();
      var detCity = '';
      if (/ঢাকা|dhaka/i.test(addr)) detCity = 'dhaka';
      else if (/চট্টগ্রাম|chattogram|chittagong/i.test(addr)) detCity = 'chittagong';
      else if (/রাজশাহী|rajshahi/i.test(addr)) detCity = 'rajshahi';
      else if (/খুলনা|khulna/i.test(addr)) detCity = 'khulna';
      else if (/সিলেট|sylhet/i.test(addr)) detCity = 'sylhet';
      else if (/বরিশাল|barishal|barisal/i.test(addr)) detCity = 'barishal';
      else if (/রংপুর|rangpur/i.test(addr)) detCity = 'rangpur';
      else if (/গাজীপুর|gazipur/i.test(addr)) detCity = 'gazipur';
      else if (/নারায়ণগঞ্জ|narayanganj/i.test(addr)) detCity = 'narayanganj';

      var isInsideDhaka = /ঢাকা|dhaka|mirpur|মিরপুর|uttara|উত্তরা|dhanmondi|ধানমণ্ডি|gulshan|গুলশান|mohammadpur|মোহাম্মদপুর/i.test(addr);
      var deliveryArea = 'home_delivery';

      window._lpTrack.sendServerEvent('Purchase', {
        event_id: eventId,
        value: totalValue,
        currency: 'BDT',
        content_name: purchaseParams.content_name,
        content_ids: purchaseParams.content_ids,
        contents: purchaseParams.contents,
        content_type: 'product',
        content_category: 'ecommerce',
        num_items: purchaseParams.num_items,
        order_id: String(result.order_number || ''),
        delivery_category: deliveryArea,
        predicted_ltv: totalValue,
        status: 'completed'
      }, {
        phone: payload.customer_phone || '',
        name: payload.customer_name || '',
        address: payload.customer_address || '',
        city: detCity,
        order_id: String(result.order_id || result.order_number || '')
      });
    }

    console.log('[Purchase] All events fired', { eventId: eventId, value: totalValue, order: result.order_number });
  }

  function showSuccessPopup(result, payload) {
    var orderNumber = result.order_number || '';
    var existingPopup = document.getElementById('__lp-success-popup');
    if (existingPopup) existingPopup.remove();

    var overlay = document.createElement('div');
    overlay.id = '__lp-success-popup';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);';

    overlay.innerHTML = '<div style="width:90%;max-width:400px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.3);animation:lpSuccessZoom .35s ease">'
      + '<div style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 24px;text-align:center;">'
      + '<div style="width:64px;height:64px;margin:0 auto 12px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;">✓</div>'
      + '<h2 style="color:#fff;font-size:22px;font-weight:800;margin:0;">অর্ডার সফল হয়েছে!</h2>'
      + '</div>'
      + '<div style="padding:24px;text-align:center;">'
      + (orderNumber ? '<p style="color:#6b7280;font-size:13px;margin:0 0 4px;">অর্ডার নম্বর</p><p style="font-size:28px;font-weight:900;color:#10b981;margin:0 0 16px;">#' + orderNumber + '</p>' : '')
      + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:12px;margin-bottom:20px;">'
      + '<p style="margin:0;font-size:13px;color:#166534;">📞 আপনার অর্ডারটি কনফার্ম করতে শীঘ্রই কল করা হবে।</p>'
      + '</div>'
      + '<button id="__lp-success-close" style="width:100%;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;">ঠিক আছে</button>'
      + '</div></div>';

    // Add animation keyframes
    var style = document.createElement('style');
    style.textContent = '@keyframes lpSuccessZoom{from{transform:scale(.85);opacity:0}to{transform:scale(1);opacity:1}}';
    overlay.appendChild(style);

    document.body.appendChild(overlay);

    var closeBtn = document.getElementById('__lp-success-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        overlay.remove();
      });
    }
  }

  function resolveTotalValue(payload) {
    var qty = parseInt(payload.quantity || '1', 10);
    if (!isFinite(qty) || qty < 1) qty = 1;
    var unitPrice = parseFloat(payload.unit_price || '0');
    if (!isFinite(unitPrice) || unitPrice < 0) unitPrice = 0;
    var explicitTotal = parseFloat(payload.total_value || '');
    return isFinite(explicitTotal) && explicitTotal >= 0 ? explicitTotal : (unitPrice * qty);
  }

  function handleSuccessfulOrder(result, payload, form, btn, successText) {
    window.__lpOrderRedirecting = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = '✓ অর্ডার সফল!';
      btn.style.backgroundColor = '#10b981';
    }

    // Fire Purchase event immediately (don't wait for page load)
    firePurchaseEvent(payload, result);

    // Render success page INSTANTLY via document.write (no React re-bootstrap needed)
    var totalValue = resolveTotalValue(payload);
    var orderNumber = result.order_number || '';
    var contentName = (payload.product_name || document.title || '').substring(0, 150);
    var numItems = parseInt(payload.quantity || '1', 10) || 1;
    var eventId = payload.event_id || '';
    var customerPhone = payload.customer_phone || '';
    var customerName = payload.customer_name || '';
    var pixelId = '${page.fb_pixel_id || ''}';
    var tiktokPixelId = '${page.tiktok_pixel_id || ''}';
    var gtmId = '${page.gtm_id || ''}';

    // Update URL without reload for clean browser history
    try { history.pushState({}, '', '/lp/' + SLUG + '/success?order_number=' + orderNumber); } catch(e) {}

    // Build and write success page HTML instantly
    var successHtml = '<!DOCTYPE html><html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>অর্ডার সফল</title><style>'
      + '*{margin:0;padding:0;box-sizing:border-box}'
      + 'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#f0fdf4;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}'
      + '.card{width:100%;max-width:420px;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,.12);animation:zi .35s ease}'
      + '@keyframes zi{from{transform:scale(.9);opacity:0}to{transform:scale(1);opacity:1}}'
      + '.hd{background:linear-gradient(135deg,#10b981,#059669);padding:36px 24px;text-align:center}'
      + '.ck{width:80px;height:80px;margin:0 auto 16px;background:rgba(255,255,255,.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;animation:pop .5s ease .15s both}'
      + '@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}'
      + '.hd h1{color:#fff;font-size:24px;font-weight:800}.hd p{color:rgba(255,255,255,.8);font-size:14px;margin-top:4px}'
      + '.bd{padding:28px 24px;text-align:center}'
      + '.ol{color:#6b7280;font-size:13px;margin-bottom:4px}.on{font-size:36px;font-weight:900;color:#10b981;margin-bottom:20px}'
      + '.ib{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:16px;margin-bottom:24px}.ib p{font-size:14px;color:#166534;line-height:1.5}'
      + '.dt{text-align:left;background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px}'
      + '.rw{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;border-bottom:1px solid #f3f4f6}.rw:last-child{border-bottom:none}'
      + '.lb{color:#6b7280}.vl{font-weight:700;color:#111}'
      + '.bt{display:block;width:100%;padding:16px;background:linear-gradient(135deg,#10b981,#059669);color:#fff;border:none;border-radius:14px;font-size:17px;font-weight:700;cursor:pointer;text-decoration:none;text-align:center}'
      + '.tr{display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap}.tr span{font-size:12px;color:#9ca3af;display:flex;align-items:center;gap:4px}'
      + '</style>';

    // Add pixel scripts in head
    if (pixelId) {
      var productCode = payload.product_code || '';
      var cleanPhone = customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.indexOf('0') === 0) cleanPhone = '880' + cleanPhone.substring(1);
      var nameParts = customerName.trim().split(/\\s+/);
      var fnVal = (nameParts[0] || '').toLowerCase();
      var lnVal = (nameParts.slice(1).join(' ') || '').toLowerCase();
      successHtml += '<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");var ip={country:"bd"};try{ip.external_id=localStorage.getItem("_vid")||""}catch(e){}';
      if (cleanPhone) successHtml += 'ip.ph="' + cleanPhone + '";';
      if (fnVal) successHtml += 'ip.fn="' + fnVal + '";';
      if (lnVal) successHtml += 'ip.ln="' + lnVal + '";';
      successHtml += 'fbq("init","' + pixelId + '",ip);fbq("track","PageView");';
      successHtml += 'fbq("track","Purchase",{value:' + totalValue + ',currency:"BDT",content_name:"' + contentName.replace(/"/g, '\\\\"') + '",content_ids:' + (productCode ? '["' + productCode + '"]' : '[]') + ',contents:' + (productCode ? '[{id:"' + productCode + '",quantity:' + numItems + ',item_price:' + Math.round(totalValue/numItems) + '}]' : '[]') + ',content_type:"product",content_category:"ecommerce",num_items:' + numItems + ',order_id:"' + orderNumber + '"},{eventID:"' + eventId + '"});';
      successHtml += '<\\/script>';
    }
    successHtml += '</head><body><div class="card"><div class="hd"><div class="ck">✓</div><h1>অর্ডার সফল হয়েছে!</h1><p>আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে</p></div><div class="bd">';
    if (orderNumber) successHtml += '<p class="ol">অর্ডার নম্বর</p><p class="on">#' + orderNumber + '</p>';
    successHtml += '<div class="ib"><p>📞 আপনার অর্ডারটি কনফার্ম করতে শীঘ্রই কল করা হবে।</p></div>';
    if (contentName) {
      successHtml += '<div class="dt"><div class="rw"><span class="lb">প্রোডাক্ট</span><span class="vl">' + contentName.substring(0,60) + '</span></div>'
        + '<div class="rw"><span class="lb">পরিমাণ</span><span class="vl">' + numItems + ' পিস</span></div>'
        + '<div class="rw"><span class="lb">মূল্য</span><span class="vl">৳' + totalValue + '</span></div></div>';
    }
    successHtml += '<a href="/lp/' + SLUG + '" class="bt">🏠 হোমে ফিরে যান</a>';
    successHtml += '<div class="tr"><span>🔒 নিরাপদ</span><span>🚚 দ্রুত ডেলিভারি</span><span>💯 গ্যারান্টি</span></div>';
    successHtml += '</div></div></body></html>';

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(function() {
      try {
        document.open();
        document.write(successHtml);
        document.close();
      } catch(e) { console.error('[LP] Success render failed', e); }
    });
  }

  function resetSubmitState(form, btn, btnOrigText) {
    _submitting = false;
    window.__lpSubmitStarted = false;
    if (form) delete form.dataset.lpSubmitLocked;
    if (btn) {
      btn.disabled = false;
      btn.textContent = btnOrigText || 'অর্ডার করুন';
    }
  }

  function isValidPhone(value) {
    var cleaned = sanitizePhone(value).replace(/^[+]?880/, '0').replace(/[^0-9]/g, '');
    if (/^[1-9]\\d{9}$/.test(cleaned)) cleaned = '0' + cleaned;
    return /^\\d{11,15}$/.test(cleaned);
  }

  function toAsciiDigits(str) {
    if (!str) return '';
    var result = '';
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      if (code >= 0x09E6 && code <= 0x09EF) { result += String(code - 0x09E6); }
      else if (code >= 0x0660 && code <= 0x0669) { result += String(code - 0x0660); }
      else { result += str.charAt(i); }
    }
    return result;
  }

  function sanitizePhone(value) {
    var input = toAsciiDigits(value);
    var result = '';
    for (var i = 0; i < input.length; i++) {
      var ch = input.charAt(i);
      if (/[0-9]/.test(ch)) result += ch;
      else if (ch === '+' && result.length === 0) result += ch;
    }
    var digitsOnly = result.replace(/^[+]/, '').replace(/[^0-9]/g, '');
    if (/^8801\\d{8,12}$/.test(digitsOnly)) digitsOnly = '0' + digitsOnly.slice(3);
    if (/^[1-9]\\d{9}$/.test(digitsOnly)) digitsOnly = '0' + digitsOnly;
    if (digitsOnly.length > 15) digitsOnly = digitsOnly.slice(0, 15);
    return digitsOnly;
  }

  function getFieldCandidates(form) {
    if (!form || !form.querySelectorAll) return [];
    var nodes = form.querySelectorAll('input, textarea, select');
    var fields = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var type = (el.getAttribute('type') || '').toLowerCase();
      var hint = getFieldHint(el);
      if (el.disabled) continue;
      if (type === 'hidden' || type === 'radio' || type === 'checkbox' || type === 'submit' || type === 'button') continue;
      if (type === 'number' && !/customer_phone|phone|mobile|customer_mobile|contact_number|whatsapp|tel|মোবাইল|ফোন/.test(hint)) continue;
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
    if (kind === 'phone' && form && form.querySelector) {
      var directPhone = form.querySelector(DIRECT_PHONE_SELECTOR);
      if (directPhone) return directPhone;
    }

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
        if (type === 'number' && !/customer_phone|phone|mobile|customer_mobile|contact_number|whatsapp|মোবাইল|ফোন/.test(hint)) score -= 60;
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
        var phoneHint = getFieldHint(fields[j]);
        if (/customer_phone|phone|mobile|customer_mobile|contact_number|whatsapp|tel|মোবাইল|ফোন/.test(phoneHint)) return fields[j];
        if (sanitizePhone(fields[j].value || fields[j].placeholder || '').length >= 10) return fields[j];
      }
      return null;
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
    var form = target && target.closest ? (target.closest(FORM_SELECTOR) || target.closest(CHECKOUT_ROOT_SELECTOR)) : null;
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

  function buildSuccessUrl(result, payload) {
    var totalValue = resolveTotalValue(payload);
    var params = new URLSearchParams();
    params.set('order_number', String(result.order_number || ''));
    params.set('value', String(totalValue));
    params.set('currency', 'BDT');
    params.set('content_name', (payload.product_name || document.title || '').substring(0, 150));
    if (payload.product_code) params.set('content_id', payload.product_code);
    params.set('num_items', String(parseInt(payload.quantity || '1', 10) || 1));
    params.set('event_id', payload.event_id || (window._lpTrack ? window._lpTrack.generateEventId() : ('eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now())));
    if (payload.customer_phone) params.set('phone', payload.customer_phone);
    if (payload.customer_name) params.set('name', payload.customer_name);
    if (result.purchase_tracked) params.set('capi_sent', '1');
    return '/lp/' + SLUG + '/success?' + params.toString();
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
            if (!data || (!data.success && !data.duplicate)) return;
            var payload = enrichedPayload || {};
            handleSuccessfulOrder(data, payload, null, null, 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + (data.order_number || ''));
          }).catch(function(){});
        }).catch(function(){});
      }
      return response;
    };
  }

  // Also patch XMLHttpRequest for templates that use XHR instead of fetch
  if (!window.__lpOrderXHRPatched) {
    window.__lpOrderXHRPatched = true;
    var _origXHROpen = XMLHttpRequest.prototype.open;
    var _origXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this.__lpUrl = String(url || '');
      return _origXHROpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
      var xhr = this;
      if (xhr.__lpUrl && xhr.__lpUrl.indexOf('submit-landing-order') !== -1 && body) {
        try {
          var payload = JSON.parse(body);
          if (!payload.landing_page_slug) payload.landing_page_slug = SLUG;
          if (!payload.event_id) payload.event_id = window._lpTrack ? window._lpTrack.generateEventId() : ('eid_' + Math.random().toString(36).substr(2,9) + '_' + Date.now());
          if (!payload.visitor_id) payload.visitor_id = VID;
          arguments[0] = JSON.stringify(payload);
        } catch(e) {}
        xhr.addEventListener('load', function() {
          try {
            var data = JSON.parse(xhr.responseText);
            if ((data.success || data.duplicate)) {
              handleSuccessfulOrder(data, JSON.parse(body), null, null, 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + (data.order_number || ''));
            }
          } catch(e) {}
        });
      }
      return _origXHRSend.apply(this, arguments);
    };
  }

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
    window.__lpSubmitStarted = true;
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
    if (!/অর্ডার|order|submit|কনফার্ম|confirm|সাবমিট|পাঠান|send|buy|কিনুন|place/i.test(btnText)) return;
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
          if (/অর্ডার|order|submit|কনফার্ম|confirm|সাবমিট|পাঠান|send|buy|কিনুন|place/i.test(btnText)) {
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
  function scanAndPatchForms(root) {
    root = root || document;
    if (root.nodeType === 1 && root.matches && root.matches(FORM_SELECTOR)) patchForm(root);
    if (!root.querySelectorAll) return;
    var forms = root.querySelectorAll(FORM_SELECTOR);
    for (var i = 0; i < forms.length; i++) patchForm(forms[i]);
  }

  scanAndPatchForms(document);

  if (typeof MutationObserver !== 'undefined') {
    var formObserverRoot = document.body || document.documentElement;
    if (formObserverRoot) {
      var formObserver = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) {
            var node = added[j];
            if (!node || node.nodeType !== 1) continue;
            scanAndPatchForms(node);
          }
        }
      });
      formObserver.observe(formObserverRoot, { subtree: true, childList: true });
    }
  }

  // 4. Lightweight delayed rescans for late-mounted popups/forms
  [800, 2500, 5000].forEach(function(delay) {
    setTimeout(function() { scanAndPatchForms(document); }, delay);
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
    if (!page?.fb_pixel_id) {
      pixelBootstrapRef.current = null;
      return;
    }

    if (pixelBootstrapRef.current === page.fb_pixel_id) return;
    ensureMetaPixelBootstrap(page.fb_pixel_id);
    pixelBootstrapRef.current = page.fb_pixel_id;
  }, [page?.fb_pixel_id]);

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

