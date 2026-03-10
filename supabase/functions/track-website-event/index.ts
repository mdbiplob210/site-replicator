import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate API key
    const apiKey = req.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('id, source_url, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .maybeSingle()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()

    // Support single event or batch
    const events: any[] = Array.isArray(body.events) ? body.events : [body]

    if (events.length === 0 || events.length > 50) {
      return new Response(JSON.stringify({ error: 'Send 1-50 events at a time' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userAgent = req.headers.get('user-agent') || null
    const sourceLabel = keyData.source_url || 'api'

    const rows = events.map((e: any) => ({
      event_type: e.event_type || 'page_view',
      page_path: e.page_path || '/',
      page_title: e.page_title || null,
      product_id: e.product_id || null,
      product_name: e.product_name || null,
      product_code: e.product_code || null,
      visitor_id: e.visitor_id || null,
      session_id: e.session_id || null,
      referrer: e.referrer || null,
      user_agent: e.user_agent || userAgent,
      device_type: e.device_type || detectDevice(e.user_agent || userAgent),
    }))

    const { error: insertError } = await supabase
      .from('website_events')
      .insert(rows)

    if (insertError) throw insertError

    // Update last_used_at on the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id)

    return new Response(JSON.stringify({ 
      success: true, 
      tracked: rows.length,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('[track-website-event] Error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function detectDevice(ua: string | null): string {
  if (!ua) return 'unknown'
  if (/Mobile|Android|iPhone/i.test(ua)) return 'mobile'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  return 'desktop'
}
