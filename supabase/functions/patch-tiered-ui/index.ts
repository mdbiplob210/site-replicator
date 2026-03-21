import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: pages, error } = await supabase
    .from("landing_pages")
    .select("id, slug, html_content")
    .eq("is_active", true);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  let patched = 0;
  for (const page of pages || []) {
    let html = page.html_content;
    if (!html) continue;

    // Only patch pages that have tiered pricing (old class names)
    if (!html.includes('tier-card') && !html.includes('tp-card')) continue;

    // Replace old tier-card classes with new tp-card classes
    // Replace old class names
    html = html.replace(/class="tier-card/g, 'class="tp-card');
    html = html.replace(/\.tier-card/g, '.tp-card');
    html = html.replace(/\.tier-grid/g, '.tp-grid-legacy');  // temp
    html = html.replace(/class="tier-grid/g, 'class="tier-grid');
    // Actually let's do a full replacement of the style block and cards

    // Find and replace the old tiered pricing style block
    const oldStylePattern = /<style>\s*\.tier-grid[\s\S]*?<\/style>/;
    const oldTpStylePattern = /<style>\s*\.tp-card[\s\S]*?<\/style>/;
    
    const newStyle = `<style>
    .tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    @media(max-width:480px){.tier-grid{gap:7px}.tp-card{padding:10px 6px!important}.tp-label{font-size:12px!important}.tp-price{font-size:18px!important}.tp-per{font-size:9px!important}.tp-free-badge{font-size:8px!important;padding:4px 6px!important}.tp-free-badge svg{width:10px!important;height:10px!important}.tp-ribbon{font-size:8px!important;padding:3px 10px!important}}
    .tp-card{position:relative;border:2px solid #e0e0e0;border-radius:16px;padding:16px 10px 14px;cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1);background:#fff;display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;overflow:visible}
    .tp-card:hover{transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,0.1)}
    .tp-card.selected{border-color:#ff6b00;background:#ff6b0006;box-shadow:0 4px 20px #ff6b0022}
    .tp-card-glow{border-color:#10b981!important;box-shadow:0 0 0 3px rgba(16,185,129,0.15),0 8px 30px rgba(16,185,129,0.12)!important}
    .tp-card-glow:hover{box-shadow:0 0 0 4px rgba(16,185,129,0.2),0 12px 35px rgba(16,185,129,0.18)!important;transform:translateY(-4px)}
    .tp-card-glow.selected{border-color:#ff6b00!important;box-shadow:0 0 0 3px #ff6b0025,0 8px 30px #ff6b0018!important}
    .tp-radio{width:20px;height:20px;border-radius:50%;border:2px solid #e0e0e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
    .tp-card.selected .tp-radio{border-color:#ff6b00;background:#ff6b00}
    .tp-radio-dot{width:8px;height:8px;border-radius:50%;background:#fff;display:none}
    .tp-card.selected .tp-radio-dot{display:block}
    .tp-label{font-size:14px;font-weight:700;color:#111}
    .tp-price{font-size:22px;font-weight:800;color:#ff6b00;line-height:1.1}
    .tp-per{font-size:11px;color:#666}
    .tp-save{display:inline-block;background:#e8f5e9;color:#2e7d32;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:2px}
    .tp-ribbon{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#ff6b00,#ff6b00dd);color:#fff;font-size:9px;font-weight:700;padding:3px 12px;border-radius:20px;white-space:nowrap;letter-spacing:.3px;box-shadow:0 2px 8px #ff6b0033}
    .tp-best{position:absolute;top:-11px;right:-4px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:8px;font-weight:800;padding:3px 8px;border-radius:10px;white-space:nowrap;box-shadow:0 2px 8px rgba(239,68,68,0.3)}
    .tp-free-badge{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#059669,#10b981);color:#fff;font-size:10px;font-weight:700;padding:5px 10px;border-radius:20px;margin-top:4px;box-shadow:0 3px 12px rgba(16,185,129,0.35);animation:tpBadgePulse 2s ease-in-out infinite;letter-spacing:.3px}
    .tp-free-wrap{position:relative;margin-top:6px;padding-top:6px}
    .tp-free-wrap::before{content:'';position:absolute;top:0;left:20%;right:20%;height:1px;background:linear-gradient(90deg,transparent,#10b98155,transparent)}
    @keyframes tpBadgePulse{0%,100%{transform:scale(1);box-shadow:0 3px 12px rgba(16,185,129,0.35)}50%{transform:scale(1.04);box-shadow:0 4px 18px rgba(16,185,129,0.5)}}
    @keyframes tpGlow{0%,100%{box-shadow:0 0 0 3px rgba(16,185,129,0.12),0 8px 30px rgba(16,185,129,0.1)}50%{box-shadow:0 0 0 5px rgba(16,185,129,0.2),0 8px 30px rgba(16,185,129,0.18)}}
    .tp-card-glow{animation:tpGlow 2.5s ease-in-out infinite}
    .tp-card-glow.selected{animation:none}
  </style>`;

    // Replace old style blocks
    if (oldStylePattern.test(html)) {
      html = html.replace(oldStylePattern, newStyle);
    } else if (oldTpStylePattern.test(html)) {
      // already has tp- styles, replace them
    }

    // Replace old tier-card divs with new tp-card divs
    // Card 1: basic card
    html = html.replace(
      /<div class="tier-card selected"([^>]*)>/g,
      '<div class="tp-card selected"$1>'
    );
    html = html.replace(
      /<div class="tier-card has-free-delivery"([^>]*)>/g,
      '<div class="tp-card tp-card-glow"$1>'
    );
    html = html.replace(
      /<div class="tier-card"([^>]*)>/g,
      '<div class="tp-card"$1>'
    );

    // Replace old inner class names
    html = html.replace(/class="tier-radio"/g, 'class="tp-radio"');
    html = html.replace(/class="tier-radio-dot"/g, 'class="tp-radio-dot"');
    html = html.replace(/class="tier-label"/g, 'class="tp-label"');
    html = html.replace(/class="tier-price"/g, 'class="tp-price"');
    html = html.replace(/class="tier-per-piece"/g, 'class="tp-per"');
    html = html.replace(/class="tier-per"/g, 'class="tp-per"');
    html = html.replace(/class="tier-save"/g, 'class="tp-save"');
    html = html.replace(/class="tier-popular"/g, 'class="tp-ribbon"');
    html = html.replace(/class="tier-best-value"/g, 'class="tp-best"');

    // Replace old free delivery badges with new design
    html = html.replace(
      /<div class="tier-free-delivery">[\s\S]*?ফ্রি ডেলিভারি<\/div>/g,
      '<div class="tp-free-wrap"><div class="tp-free-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>🎉 ফ্রি ডেলিভারি!</div></div>'
    );

    // Also handle pages that already have tp-free-delivery (old version)
    html = html.replace(
      /<div class="tp-free-delivery">[\s\S]*?ফ্রি ডেলিভারি<\/div>/g,
      '<div class="tp-free-wrap"><div class="tp-free-badge"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>🎉 ফ্রি ডেলিভারি!</div></div>'
    );

    // Fix JS: querySelectorAll('.tier-card') -> '.tp-card'
    html = html.replace(/querySelectorAll\('\.tier-card'\)/g, "querySelectorAll('.tp-card')");

    // Ensure syncTierToCheckout hides delivery area for qty>=2
    if (html.includes('syncTierToCheckout') && !html.includes("areaSection.style.display=q>=2?'none':''")) {
      html = html.replace(
        /dcArea\.dataset\.effectiveCharge=dcVal;/g,
        "dcArea.dataset.effectiveCharge=dcVal;\n  var areaSection=document.getElementById('deliveryAreaSection');if(areaSection){areaSection.style.display=q>=2?'none':''}"
      );
    }

    const { error: updateError } = await supabase
      .from("landing_pages")
      .update({ html_content: html })
      .eq("id", page.id);

    if (!updateError) patched++;
  }

  return new Response(JSON.stringify({ success: true, patched, total: pages?.length }), { headers: corsHeaders });
});
