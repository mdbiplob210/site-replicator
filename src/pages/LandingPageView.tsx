import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useEffect, useRef } from "react";

export default function LandingPageView() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useLandingPageBySlug(slug || "");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!page) return;

    // Inject tracking pixels into the document head
    const scripts: HTMLElement[] = [];

    // Facebook Pixel
    if (page.fb_pixel_id) {
      const fbScript = document.createElement("script");
      fbScript.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${page.fb_pixel_id}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(fbScript);
      scripts.push(fbScript);

      const fbNoscript = document.createElement("noscript");
      fbNoscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${page.fb_pixel_id}&ev=PageView&noscript=1"/>`;
      document.head.appendChild(fbNoscript);
      scripts.push(fbNoscript);
    }

    // TikTok Pixel
    if (page.tiktok_pixel_id) {
      const ttScript = document.createElement("script");
      ttScript.innerHTML = `
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=[\"page\",\"track\",\"identify\",\"instances\",\"debug\",\"on\",\"off\",\"once\",\"ready\",\"alias\",\"group\",\"enableCookie\",\"disableCookie\",\"holdConsent\",\"revokeConsent\",\"grantConsent\"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r=\"https://analytics.tiktok.com/i18n/pixel/events.js\",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement(\"script\");i.type=\"text/javascript\",i.async=!0,i.src=r+\"?sdkid=\"+e+\"&lib=\"+t;var a=document.getElementsByTagName(\"script\")[0];a.parentNode.insertBefore(i,a)};
          ttq.load('${page.tiktok_pixel_id}');
          ttq.page();
        }(window, document, 'ttq');
      `;
      document.head.appendChild(ttScript);
      scripts.push(ttScript);
    }

    // GTM
    if (page.gtm_id) {
      const gtmScript = document.createElement("script");
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${page.gtm_id}');
      `;
      document.head.appendChild(gtmScript);
      scripts.push(gtmScript);
    }

    // Custom head scripts
    if (page.custom_head_scripts) {
      const customDiv = document.createElement("div");
      customDiv.innerHTML = page.custom_head_scripts;
      Array.from(customDiv.children).forEach((child) => {
        const clone = child.cloneNode(true) as HTMLElement;
        document.head.appendChild(clone);
        scripts.push(clone);
      });
    }

    return () => {
      scripts.forEach((s) => s.parentNode?.removeChild(s));
    };
  }, [page]);

  // Render HTML content using srcdoc iframe for full isolation
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

  // Build full HTML with tracking scripts injected
  const buildFullHtml = () => {
    let trackingScripts = "";

    if (page.fb_pixel_id) {
      trackingScripts += `
<!-- Facebook Pixel -->
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${page.fb_pixel_id}');
fbq('track','PageView');
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

    // Conversion tracking script — auto-detects data-track-* attributes on any element
    const conversionScript = `
<!-- Conversion Tracking -->
<script>
(function(){
  function fireEvent(el) {
    var event = el.getAttribute('data-track-event');
    var currency = el.getAttribute('data-track-currency') || 'BDT';
    var value = parseFloat(el.getAttribute('data-track-value') || '0');
    var contentName = el.getAttribute('data-track-content-name') || '';
    var contentId = el.getAttribute('data-track-content-id') || '';
    if (!event) return;

    var params = {};
    if (value) params.value = value;
    if (currency) params.currency = currency;
    if (contentName) params.content_name = contentName;
    if (contentId) params.content_ids = [contentId];

    // Facebook Pixel
    if (typeof fbq === 'function') {
      var fbEvent = event;
      var fbParams = {value: value, currency: currency};
      if (contentName) fbParams.content_name = contentName;
      if (contentId) fbParams.content_ids = [contentId];
      fbq('track', fbEvent, fbParams);
      console.log('[Tracking] FB:', fbEvent, fbParams);
    }

    // TikTok Pixel
    if (typeof ttq !== 'undefined' && ttq.track) {
      var ttEvent = event;
      // Map common FB events to TikTok events
      var ttMap = {Purchase:'CompletePayment',AddToCart:'AddToCart',Lead:'SubmitForm',InitiateCheckout:'InitiateCheckout',ViewContent:'ViewContent',CompleteRegistration:'CompleteRegistration'};
      if (ttMap[event]) ttEvent = ttMap[event];
      var ttParams = {value: value, currency: currency};
      if (contentName) ttParams.content_name = contentName;
      if (contentId) ttParams.content_id = contentId;
      ttq.track(ttEvent, ttParams);
      console.log('[Tracking] TikTok:', ttEvent, ttParams);
    }

    // GTM dataLayer
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({event: 'conversion_' + event, value: value, currency: currency, content_name: contentName});
      console.log('[Tracking] GTM:', event);
    }
  }

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-track-event]');
    if (el) fireEvent(el);
  });
})();
</script>
`;

    // Analytics tracking script — tracks views and clicks to backend
    const supabaseUrl = "${import.meta.env.VITE_SUPABASE_URL || ''}";
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
      navigator.sendBeacon(TRACK_URL, JSON.stringify({
        slug: SLUG,
        event_type: eventType,
        event_name: eventName || null,
        visitor_id: VID,
        referrer: document.referrer || null
      }));
    } catch(e) {
      fetch(TRACK_URL, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({slug:SLUG,event_type:eventType,event_name:eventName||null,visitor_id:VID,referrer:document.referrer||null})}).catch(function(){});
    }
  }

  // Track page view
  send('view');

  // Track clicks on tracked elements
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

    // If HTML already has </head>, inject tracking into it
    if (page.html_content.includes("</head>")) {
      return page.html_content.replace("</head>", `${trackingScripts}${conversionScript}${analyticsScript}</head>`);
    }

    // Otherwise wrap in full HTML
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${trackingScripts}${conversionScript}${analyticsScript}</head><body>${page.html_content}</body></html>`;
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
