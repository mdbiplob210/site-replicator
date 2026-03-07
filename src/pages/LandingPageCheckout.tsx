import { useParams } from "react-router-dom";
import { useLandingPageBySlug } from "@/hooks/useLandingPages";
import { useEffect, useRef } from "react";

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

  // Build checkout HTML with order submission script
  const buildCheckoutHtml = () => {
    let trackingScripts = "";

    if (page.fb_pixel_id) {
      trackingScripts += `
<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${page.fb_pixel_id}');
fbq('track','PageView');
fbq('track','InitiateCheckout');
</script>`;
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

    // Order submission script injected into checkout page
    const orderScript = `
<script>
(function(){
  var ORDER_URL = '${supabaseUrl}/functions/v1/submit-landing-order';
  var SLUG = '${page.slug}';
  var VID = localStorage.getItem('_lp_vid') || '';

  // Listen for form submissions with data-checkout-form attribute
  document.addEventListener('submit', function(e) {
    var form = e.target.closest('[data-checkout-form]');
    if (!form) return;
    e.preventDefault();

    var btn = form.querySelector('[type="submit"], button:not([type])');
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
        // Fire purchase events
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', { value: payload.unit_price * payload.quantity, currency: 'BDT', content_name: payload.product_name });
        }
        if (typeof ttq !== 'undefined' && ttq.track) {
          ttq.track('CompletePayment', { value: payload.unit_price * payload.quantity, currency: 'BDT' });
        }
        if (typeof dataLayer !== 'undefined') {
          dataLayer.push({ event: 'conversion_Purchase', value: payload.unit_price * payload.quantity });
        }

        // Show success or redirect
        var successUrl = form.getAttribute('data-success-url');
        if (successUrl) {
          window.location.href = successUrl;
        } else {
          var msg = form.getAttribute('data-success-message') || 'আপনার অর্ডার সফলভাবে জমা হয়েছে! অর্ডার নম্বর: ' + data.order_number;
          document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;"><div style="text-align:center;padding:40px;"><h1 style="color:#10b981;font-size:48px;">✓</h1><h2 style="margin:16px 0;">অর্ডার সফল!</h2><p>' + msg + '</p></div></div>';
        }
      } else {
        alert(data.error || 'অর্ডার সাবমিট করতে সমস্যা হয়েছে');
        if (btn) { btn.disabled = false; btn.textContent = 'অর্ডার করুন'; }
      }
    })
    .catch(function(err) {
      alert('ত্রুটি: ' + err.message);
      if (btn) { btn.disabled = false; btn.textContent = 'অর্ডার করুন'; }
    });
  });
})();
</script>`;

    if (page.checkout_html!.includes("</head>")) {
      return page.checkout_html!.replace("</head>", `${trackingScripts}${orderScript}</head>`);
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${trackingScripts}${orderScript}</head><body>${page.checkout_html}</body></html>`;
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
