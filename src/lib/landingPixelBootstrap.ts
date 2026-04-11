type LandingPixelFn = ((...args: any[]) => void) & {
  callMethod?: (...args: any[]) => void;
  queue?: any[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: any[]) => number;
};

type LandingPixelWindow = Window & typeof globalThis & {
  fbq?: LandingPixelFn;
  _fbq?: LandingPixelFn;
  _lpPageViewEventId?: string;
  __lpPageViewTracked?: boolean;
  __lpMetaPixelBootstrapped?: Record<string, boolean>;
  __lpMetaPixelTrackedUrls?: Record<string, string>;
  __lpCurrentPixelId?: string;
  __lpMetaPixelLifecycleInstalled?: boolean;
  __lpFbSdkLoaded?: boolean;
  __lpFlushPendingBrowserPurchases?: () => boolean;
};

const META_PIXEL_SDK_SRC = "https://connect.facebook.net/en_US/fbevents.js";

function getExternalId(win: LandingPixelWindow) {
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

  return externalId;
}

function normalizeTrackedUrl(url: string) {
  if (typeof window === "undefined") return url;

  try {
    const parsed = new URL(url, window.location.origin);
    parsed.hash = "";
    return parsed.toString();
  } catch (_) {
    return String(url || "").split("#")[0] || String(url || "");
  }
}

function ensureFbqStub(win: LandingPixelWindow) {
  if (typeof win.fbq === "function") return;

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
}

function ensureMetaPixelSdk(win: LandingPixelWindow) {
  const existingScript = document.querySelector(
    'script[data-lp-meta-pixel-sdk="true"],script[src*="connect.facebook.net/en_US/fbevents.js"]'
  ) as HTMLScriptElement | null;

  if (existingScript) {
    existingScript.dataset.lpMetaPixelSdk = "true";
    return;
  }

  const script = document.createElement("script");
  script.src = META_PIXEL_SDK_SRC;
  script.async = false;
  script.defer = false;
  script.dataset.lpMetaPixelSdk = "true";
  script.onload = () => {
    win.__lpFbSdkLoaded = true;
    console.info("[LP Pixel] SDK loaded", { fbqType: typeof win.fbq, ready: typeof win.fbq?.callMethod === "function" });
    win.__lpFlushPendingBrowserPurchases?.();
  };
  script.onerror = () => {
    console.error("[LP Pixel] SDK failed to load", { src: META_PIXEL_SDK_SRC });
  };

  const head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
  const firstScript = head.querySelector("script") || document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    head.appendChild(script);
  }
}

function trackLandingPageView(pixelId: string, options?: { force?: boolean }) {
  if (typeof window === "undefined" || !pixelId) return "";

  const win = window as LandingPixelWindow;
  win.__lpMetaPixelTrackedUrls = win.__lpMetaPixelTrackedUrls || {};

  const currentUrl = normalizeTrackedUrl(window.location.href);
  const trackingKey = `${pixelId}:${currentUrl}`;
  const existingEventId = win.__lpMetaPixelTrackedUrls[trackingKey];

  if (existingEventId && !options?.force) {
    win._lpPageViewEventId = existingEventId;
    win.__lpPageViewTracked = true;
    return existingEventId;
  }

  const eventId = `eid_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  win._lpPageViewEventId = eventId;

  const externalId = getExternalId(win);
  win.fbq?.("init", pixelId, { external_id: externalId, country: "bd" });

  try {
    win.fbq?.("set", "autoConfig", true, pixelId);
  } catch (_) {}

  win.fbq?.("track", "PageView", {}, { eventID: eventId });
  win.__lpMetaPixelTrackedUrls[trackingKey] = eventId;
  win.__lpPageViewTracked = true;
  console.info("[LP Pixel] PageView fired", {
    pixelId,
    eventId,
    url: currentUrl,
    fbqType: typeof win.fbq,
    ready: typeof win.fbq?.callMethod === "function",
  });

  return eventId;
}

function installLandingPixelLifecycle(win: LandingPixelWindow) {
  if (win.__lpMetaPixelLifecycleInstalled) return;

  const fire = () => {
    if (!win.__lpCurrentPixelId) return;
    trackLandingPageView(win.__lpCurrentPixelId);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fire, { once: true });
  } else {
    queueMicrotask(fire);
  }

  window.addEventListener("load", fire, { once: true });
  window.addEventListener("pageshow", fire);
  window.addEventListener("popstate", fire);
  window.addEventListener("hashchange", fire);

  (["pushState", "replaceState"] as const).forEach((method) => {
    const original = window.history[method] as any;
    if (original?.__lpWrapped) return;

    const wrapped = function (this: History, ...args: any[]) {
      const result = original.apply(this, args);
      setTimeout(fire, 0);
      return result;
    };

    wrapped.__lpWrapped = true;
    (window.history as any)[method] = wrapped;
  });

  win.__lpMetaPixelLifecycleInstalled = true;
}

export function ensureMetaPixelBootstrap(pixelId: string) {
  if (typeof window === "undefined" || !pixelId) return;

  const win = window as LandingPixelWindow;
  win.__lpMetaPixelBootstrapped = win.__lpMetaPixelBootstrapped || {};

  ensureFbqStub(win);
  ensureMetaPixelSdk(win);
  installLandingPixelLifecycle(win);
  win.__lpCurrentPixelId = pixelId;
  trackLandingPageView(pixelId);

  win.__lpMetaPixelBootstrapped[pixelId] = true;
}

export function buildMetaPixelHeadScript(pixelId: string) {
  if (!pixelId) return "";

  // Architecture: Static SDK <script> tag + separate inline init script
  // This ensures the browser loads fbevents.js as part of normal HTML parsing,
  // which is more reliable than dynamic createElement inside document.write()

  const stubAndInit = `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];}(window,document,'script','${META_PIXEL_SDK_SRC}');
(function(w,d,pixelId){
w.__lpMetaPixelBootstrapped=w.__lpMetaPixelBootstrapped||{};w.__lpMetaPixelTrackedUrls=w.__lpMetaPixelTrackedUrls||{};w.__lpMetaPixelLifecycleInstalled=!!w.__lpMetaPixelLifecycleInstalled;w.__lpPageViewTracked=!!w.__lpPageViewTracked;w.__lpFbSdkLoaded=!!w.__lpFbSdkLoaded;w.__lpCurrentPixelId=pixelId;
function norm(u){try{var x=new URL(u,w.location.origin);x.hash='';return x.toString();}catch(e){return String(u||'').split('#')[0]||String(u||'');}}
function ext(){var id='';try{id=localStorage.getItem('_vid')||'';}catch(e){}if(!id){id='v_'+Date.now()+'_'+Math.random().toString(36).substr(2,12);try{localStorage.setItem('_vid',id);}catch(e){}}return id;}
var _extId=ext();w._fbPixelId=pixelId;
console.info('[LP Pixel] Head bootstrap start',{pixelId:pixelId,url:w.location.href,fbqType:typeof w.fbq});
w.__lpPersistPendingBrowserPurchases=function(queue){try{sessionStorage.setItem('_lp_pending_fb_purchases',JSON.stringify(queue||[]));}catch(e){}};
w.__lpLoadPendingBrowserPurchases=function(){try{var raw=sessionStorage.getItem('_lp_pending_fb_purchases');return raw?JSON.parse(raw):[];}catch(e){return[];}};
w.__lpPendingBrowserPurchases=w.__lpPendingBrowserPurchases||w.__lpLoadPendingBrowserPurchases();
w.__lpFiredBrowserPurchases=w.__lpFiredBrowserPurchases||{};
w.__lpHasBrowserPurchaseFired=function(eventId){if(!eventId)return false;if(w.__lpFiredBrowserPurchases[eventId])return true;try{return sessionStorage.getItem('_lp_fired_fb_purchase:'+eventId)==='1';}catch(e){return false;}};
w.__lpMarkBrowserPurchaseFired=function(eventId){if(!eventId)return;w.__lpFiredBrowserPurchases[eventId]=true;try{sessionStorage.setItem('_lp_fired_fb_purchase:'+eventId,'1');}catch(e){}};
w.__lpQueueBrowserPurchase=function(params,options){var queue=w.__lpPendingBrowserPurchases||[];var eventId=options&&options.eventID?String(options.eventID):'';if(eventId&&w.__lpHasBrowserPurchaseFired(eventId))return true;for(var i=0;i<queue.length;i++){var queued=queue[i];if(queued&&queued.options&&String(queued.options.eventID||'')===eventId)return true;}queue.push({params:params||{},options:options||{}});w.__lpPendingBrowserPurchases=queue;w.__lpPersistPendingBrowserPurchases(queue);return true;};
w.__lpFlushPendingBrowserPurchases=function(){var ref=w.fbq||w._fbq||w.__lpFbqRef;var ready=!!(ref&&typeof ref==='function'&&typeof ref.callMethod==='function');if(!ready)return false;w.__lpFbqRef=ref;var queue=w.__lpPendingBrowserPurchases||[];if(!queue.length)return true;var remaining=[];for(var i=0;i<queue.length;i++){var item=queue[i];if(!item)continue;var eventId=item.options&&item.options.eventID?String(item.options.eventID):'';if(eventId&&w.__lpHasBrowserPurchaseFired(eventId))continue;try{ref('track','Purchase',item.params||{},item.options||{});if(eventId)w.__lpMarkBrowserPurchaseFired(eventId);}catch(err){remaining.push(item);}}w.__lpPendingBrowserPurchases=remaining;w.__lpPersistPendingBrowserPurchases(remaining);return remaining.length===0;};
w.__lpIsFbPixelReady=function(){var ref=w.fbq||w._fbq||w.__lpFbqRef;return!!(ref&&typeof ref==='function'&&typeof ref.callMethod==='function');};
w.__lpTrackBrowserPurchase=function(params,options){var eventId=options&&options.eventID?String(options.eventID):'';if(eventId&&w.__lpHasBrowserPurchaseFired(eventId))return true;w.__lpQueueBrowserPurchase(params,options);if(w.__lpFlushPendingBrowserPurchases())return true;if(!w.__lpBrowserPurchaseRetryTimer){var attempts=0;w.__lpBrowserPurchaseRetryTimer=setInterval(function(){attempts+=1;var drained=w.__lpFlushPendingBrowserPurchases();if(drained||attempts>=40){clearInterval(w.__lpBrowserPurchaseRetryTimer);w.__lpBrowserPurchaseRetryTimer=null;}},250);}return true;};
w._updateFBAdvancedMatching=function(data){if(!data||!w._fbPixelId)return;var ud=w._lpTrack?w._lpTrack.getUserData():{};if(data.phone)ud.phone=data.phone;if(data.name)ud.name=data.name;if(data.city)ud.city=data.city;if(w._lpTrack)w._lpTrack.setUserData(ud);var initParams={external_id:_extId,country:'bd'};if(ud.phone){var ph=ud.phone.replace(/[^0-9]/g,'');if(ph.indexOf('0')===0)ph='880'+ph.substring(1);initParams.ph=ph;}if(ud.name){var parts=ud.name.trim().split(/\\s+/);initParams.fn=(parts[0]||'').toLowerCase();initParams.ln=(parts.slice(1).join(' ')||'').toLowerCase();}if(ud.city)initParams.ct=ud.city.toLowerCase();w.fbq('init',w._fbPixelId,initParams);console.info('[LP Pixel] Advanced match updated',{pixelId:w._fbPixelId,ready:typeof w.fbq.callMethod==='function'});};
w.__lpFireLandingPageView=function(force){var key=pixelId+':'+norm(w.location.href);if(!force&&w.__lpMetaPixelTrackedUrls[key]){w._lpPageViewEventId=w.__lpMetaPixelTrackedUrls[key];w.__lpPageViewTracked=true;return w._lpPageViewEventId;}var eventId='eid_'+Math.random().toString(36).substr(2,9)+'_'+Date.now();w._lpPageViewEventId=eventId;w.fbq('init',pixelId,{external_id:_extId,country:'bd'});try{w.fbq('set','autoConfig',true,pixelId);}catch(e){}w.fbq('track','PageView',{},{eventID:eventId});w.__lpMetaPixelTrackedUrls[key]=eventId;w.__lpPageViewTracked=true;console.info('[LP Pixel] PageView fired',{pixelId:pixelId,eventId:eventId,url:norm(w.location.href),fbqType:typeof w.fbq,ready:typeof(w.fbq&&w.fbq.callMethod)==='function'});return eventId;};
if(!w.__lpMetaPixelLifecycleInstalled){var fire=function(){if(w.__lpCurrentPixelId&&typeof w.__lpFireLandingPageView==='function')w.__lpFireLandingPageView(false);};if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',fire,{once:true});}else{setTimeout(fire,0);}w.addEventListener('load',fire,{once:true});w.addEventListener('pageshow',fire);w.addEventListener('popstate',fire);w.addEventListener('hashchange',fire);['pushState','replaceState'].forEach(function(method){var original=w.history[method];if(original&&original.__lpWrapped)return;var wrapped=function(){var result=original.apply(this,arguments);setTimeout(fire,0);return result;};wrapped.__lpWrapped=true;w.history[method]=wrapped;});w.__lpMetaPixelLifecycleInstalled=true;}
w.__lpMetaPixelBootstrapped[pixelId]=true;w.__lpFireLandingPageView(false);
})(window,document,${JSON.stringify(pixelId)});
<\/script>`;

  // Static SDK script tag — SYNCHRONOUS (no async/defer) so fbevents.js is fully
  // loaded and fbq.callMethod is ready BEFORE the page finishes parsing.
  // This guarantees Pixel Helper detects the pixel on FIRST load, not just refresh.
  // In document.write() context, a sync script blocks parsing until loaded (~50-80ms cached).
  const sdkTag = `<script src="${META_PIXEL_SDK_SRC}" data-lp-meta-pixel-sdk="true" onload="window.__lpFbSdkLoaded=true;console.info('[LP Pixel] SDK loaded + ready');if(typeof window.__lpFlushPendingBrowserPurchases==='function')window.__lpFlushPendingBrowserPurchases();" onerror="console.error('[LP Pixel] SDK failed to load',{src:'${META_PIXEL_SDK_SRC}'});"><\/script>`;

  return stubAndInit + sdkTag;
}

export function buildMetaPixelNoscript(pixelId: string) {
  if (!pixelId) return "";
  return `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" alt="" /></noscript>`;
}