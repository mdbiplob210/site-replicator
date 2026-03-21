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
    if (!html.includes('tp-card') && !html.includes('tp-card-glow')) continue;

    // Revert tp-card classes back to tier-card
    html = html.replace(/class="tp-card tp-card-glow"/g, 'class="tier-card has-free-delivery"');
    html = html.replace(/class="tp-card selected"/g, 'class="tier-card selected"');
    html = html.replace(/class="tp-card"/g, 'class="tier-card"');
    html = html.replace(/class="tp-radio"/g, 'class="tier-radio"');
    html = html.replace(/class="tp-radio-dot"/g, 'class="tier-radio-dot"');
    html = html.replace(/class="tp-label"/g, 'class="tier-label"');
    html = html.replace(/class="tp-price"/g, 'class="tier-price"');
    html = html.replace(/class="tp-per"/g, 'class="tier-per-piece"');
    html = html.replace(/class="tp-save"/g, 'class="tier-save"');
    html = html.replace(/class="tp-ribbon"/g, 'class="tier-popular"');
    html = html.replace(/class="tp-best"/g, 'class="tier-best-value"');

    // Revert free delivery badges
    html = html.replace(
      /<div class="tp-free-wrap">[\s\S]*?<div class="tp-free-badge">[\s\S]*?ফ্রি ডেলিভারি!<\/div>\s*<\/div>/g,
      '<div class="tier-free-delivery"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>ফ্রি ডেলিভারি</div>'
    );

    // Fix JS selector
    html = html.replace(/querySelectorAll\('\.tp-card'\)/g, "querySelectorAll('.tier-card')");

    // Replace the style block - remove tp- styles and add tier- styles
    const tpStylePattern = /<style>\s*\.tier-grid[\s\S]*?\.tp-card[\s\S]*?<\/style>/;
    if (tpStylePattern.test(html)) {
      html = html.replace(tpStylePattern, `<style>
    .tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    @media(max-width:480px){.tier-grid{gap:6px}.tier-card{padding:10px 6px}.tier-label{font-size:12px}.tier-price{font-size:17px}.tier-per{font-size:9px}.tier-free-delivery{font-size:9px!important;padding:3px 6px!important}.tier-free-delivery svg{width:10px!important;height:10px!important}}
    .tier-card{position:relative;border:2px solid #e8e8e8;border-radius:16px;padding:14px 10px;cursor:pointer;transition:all .3s cubic-bezier(.22,1,.36,1);background:#fff;display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;overflow:visible}
    .tier-card:hover{border-color:#ff6b0088;transform:translateY(-3px);box-shadow:0 8px 25px rgba(0,0,0,0.12)}
    .tier-card.selected{border-color:#ff6b00;background:#ff6b0008;box-shadow:0 4px 20px #ff6b0022}
    .tier-card.has-free-delivery{border-color:#a7f3d0}
    .tier-card.has-free-delivery.selected{border-color:#ff6b00}
    .tier-radio{width:22px;height:22px;border-radius:50%;border:2px solid #e8e8e8;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .2s}
    .tier-card.selected .tier-radio{border-color:#ff6b00;background:#ff6b00}
    .tier-radio-dot{width:9px;height:9px;border-radius:50%;background:#fff;display:none}
    .tier-card.selected .tier-radio-dot{display:block}
    .tier-label{font-size:14px;font-weight:700;color:#111}
    .tier-price{font-size:22px;font-weight:800;color:#ff6b00;line-height:1.1}
    .tier-per-piece{font-size:11px;color:#666}
    .tier-save{display:inline-block;background:#e8f5e9;color:#2e7d32;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-top:2px}
    .tier-popular{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#ff6b00,#ff6b00dd);color:#fff;font-size:9px;font-weight:700;padding:2px 10px;border-radius:20px;white-space:nowrap;letter-spacing:.3px}
    .tier-free-delivery{display:inline-flex;align-items:center;gap:3px;background:linear-gradient(135deg,#ecfdf5,#d1fae5);color:#059669;font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;margin-top:3px;border:1px solid #a7f3d0;animation:freeDeliveryPulse 2s ease-in-out infinite}
    .tier-best-value{position:absolute;top:-10px;right:-6px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-size:8px;font-weight:800;padding:2px 8px;border-radius:10px;white-space:nowrap;letter-spacing:.3px;box-shadow:0 2px 8px rgba(239,68,68,0.3)}
    @keyframes freeDeliveryPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.85;transform:scale(1.02)}}
  </style>`);
    }

    const { error: updateError } = await supabase
      .from("landing_pages")
      .update({ html_content: html })
      .eq("id", page.id);

    if (!updateError) patched++;
  }

  return new Response(JSON.stringify({ success: true, patched, total: pages?.length }), { headers: corsHeaders });
});
