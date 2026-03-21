import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: pages, error } = await supabase
      .from("landing_pages")
      .select("id, slug, html_content")
      .eq("is_active", true);

    if (error) throw error;

    let updated = 0;

    for (const page of pages || []) {
      let html = page.html_content || "";

      // Skip if already patched
      if (html.includes("tier-free-delivery") || html.includes("ফ্রি ডেলিভারি</div>")) {
        continue;
      }

      // Check if this page has tiered pricing
      if (!html.includes("tieredPricingSection") || !html.includes("tierCard2")) {
        continue;
      }

      // ═══ PATCH 1: Add free delivery badges to tier cards ═══
      
      // Add "ফ্রি ডেলিভারি" badge CSS
      const freeDeliveryCss = `
    .tier-free-delivery{display:inline-flex;align-items:center;gap:3px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#059669;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;margin-top:3px;border:1px solid #a7f3d0;animation:freeDeliveryPulse 2s ease-in-out infinite}
    .tier-best-value{position:absolute;top:-10px;right:-6px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:8px;font-weight:800;padding:2px 8px;border-radius:10px;white-space:nowrap;letter-spacing:.3px;box-shadow:0 2px 8px rgba(239,68,68,0.3)}
    .tier-card.has-free-delivery{border-color:#a7f3d0}
    .tier-card.has-free-delivery.selected{border-color:inherit}
    @keyframes freeDeliveryPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.02)}}`;

      // Insert CSS before closing </style> in tier section
      html = html.replace(
        /(.tier-popular\{[^}]+\})\s*<\/style>/,
        `$1${freeDeliveryCss}\n  </style>`
      );

      const freeDeliveryBadgeHtml = `<div class="tier-free-delivery"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>ফ্রি ডেলিভারি</div>`;

      // Add has-free-delivery class and badge to tierCard2
      html = html.replace(
        /(<div class="tier-card")\s*(onclick="selectTier\(2\)" id="tierCard2">)/,
        `$1 has-free-delivery $2`
      );
      // Add badge before closing </div> of tierCard2
      html = html.replace(
        /(id="tierCard2">[\s\S]*?)((<div class="tier-save">[\s\S]*?<\/div>)?)\s*<\/div>\s*\n?\s*<div class="tier-card"\s*onclick="selectTier\(3\)"/,
        (match) => {
          // Insert badge before tierCard3
          return match.replace(
            /(<\/div>)\s*\n?\s*(<div class="tier-card"\s*onclick="selectTier\(3\)")/,
            `\n      ${freeDeliveryBadgeHtml}\n    $1\n\n    $2`
          );
        }
      );

      // Add has-free-delivery class and badge to tierCard3
      html = html.replace(
        /(<div class="tier-card")\s*(onclick="selectTier\(3\)" id="tierCard3">)/,
        `$1 has-free-delivery $2`
      );

      // Add best value badge to tierCard3
      html = html.replace(
        /(id="tierCard3">)\s*(<div class="tier-radio">)/,
        `$1\n      <div class="tier-best-value">💎 বেস্ট ভ্যালু</div>\n      $2`
      );

      // Add free delivery badge before closing of tierCard3
      // Find the last </div> before </div>\s*</div>\s*</div> (end of tier-grid)
      html = html.replace(
        /(id="tierCard3">[\s\S]*?)((<div class="tier-save">[\s\S]*?<\/div>)?)\s*<\/div>\s*\n?\s*<\/div>\s*\n?\s*<\/div>/,
        (match) => {
          // Add badge before the triple closing divs
          const lastDivIdx = match.lastIndexOf("</div>");
          const secondLastIdx = match.lastIndexOf("</div>", lastDivIdx - 1);
          const thirdLastIdx = match.lastIndexOf("</div>", secondLastIdx - 1);
          return match.slice(0, thirdLastIdx) + `\n      ${freeDeliveryBadgeHtml}\n    ` + match.slice(thirdLastIdx);
        }
      );

      // ═══ PATCH 2: Add deliveryAreaSection id ═══
      html = html.replace(
        /<div style="background:linear-gradient\(135deg,#f8fafc,#f1f5f9\);border-radius:16px;padding:14px;margin-bottom:16px;border:1px solid #e2e8f0">\s*<label[^>]*>📍 ডেলিভারি এরিয়া<\/label>/,
        (match) => match.replace('<div style="background:', '<div id="deliveryAreaSection" style="background:')
      );

      // ═══ PATCH 3: Update syncTierToCheckout to set free delivery for q>=2 ═══
      html = html.replace(
        /function syncTierToCheckout\(\)\{[\s\S]*?var dcArea=document\.getElementById\('deliveryChargeAmount'\);\s*var dcVal=dcArea\?parseInt\(dcArea\.dataset\.charge\)\|\|deliveryCharge:deliveryCharge;\s*document\.getElementById\('sumTotal'\)\.textContent='৳'\+\(productPrice\+dcVal\);/,
        `function syncTierToCheckout(){
  var q=typeof selectedTier!=='undefined'?selectedTier:1;
  document.getElementById('checkoutQtyHidden').value=q;
  var productPrice=tieredPrices[q]||tieredPrices[1];
  document.getElementById('sumProduct').textContent='৳'+productPrice;
  var dcArea=document.getElementById('deliveryChargeAmount');
  var baseDc=dcArea?parseInt(dcArea.dataset.charge)||deliveryCharge:deliveryCharge;
  var dcVal=q>=2?0:baseDc;
  dcArea.textContent=dcVal===0?'ফ্রি':'৳'+dcVal;
  dcArea.dataset.effectiveCharge=dcVal;
  document.getElementById('checkoutForm').setAttribute('data-delivery-charge',dcVal);
  document.getElementById('sumTotal').textContent='৳'+(productPrice+dcVal);`
      );

      // Add delivery area section hide/show logic
      if (!html.includes("deliveryAreaSection")) {
        // If the id wasn't added above (different format), skip
      }
      html = html.replace(
        /(var hp=document\.getElementById\('headerPrice'\);if\(hp\)hp\.textContent='৳'\+productPrice;\s*\})/,
        `var hp=document.getElementById('headerPrice');if(hp)hp.textContent='৳'+productPrice;
  var areaSection=document.getElementById('deliveryAreaSection');
  if(areaSection){areaSection.style.display=q>=2?'none':''}
}`
      );

      // ═══ PATCH 4: Update submit handler to use free delivery for q>=2 ═══
      html = html.replace(
        /var q=parseInt\(fd\.get\('quantity'\)\)\|\|1;var dcVal=parseInt\(this\.dataset\.deliveryCharge\)\|\|\d+;/,
        `var q=parseInt(fd.get('quantity'))||1;var dcVal=q>=2?0:(parseInt(this.dataset.deliveryCharge)||0);`
      );

      // Update the page
      const { error: updateError } = await supabase
        .from("landing_pages")
        .update({ html_content: html, updated_at: new Date().toISOString() })
        .eq("id", page.id);

      if (updateError) {
        console.error(`Failed to update ${page.slug}:`, updateError.message);
      } else {
        updated++;
        console.log(`Patched: ${page.slug}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, updated, total: pages?.length || 0 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[patch-landing-pages] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
