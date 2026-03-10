import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { customer_phone, customer_name, message, product_name, visitor_id } = body

    if (!customer_phone && !visitor_id) {
      return new Response(JSON.stringify({ error: 'customer_phone or visitor_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Use visitor_id as placeholder phone if no phone provided
    const phone = customer_phone || `visitor-${visitor_id || Date.now()}`
    const name = customer_name || (product_name ? `${product_name} - WhatsApp Lead` : 'WhatsApp Lead')

    // Check if conversation already exists for this phone
    const { data: existingConv } = await supabase
      .from('whatsapp_conversations')
      .select('id, unread_count')
      .eq('customer_phone', phone)
      .limit(1)
      .maybeSingle()

    let conversationId: string
    const msgContent = message || (product_name
      ? `📦 "${product_name}" প্রোডাক্টটি সম্পর্কে WhatsApp এ মেসেজ করেছে।`
      : '💬 WhatsApp এ মেসেজ করেছে।')

    if (existingConv) {
      conversationId = existingConv.id
      await supabase.from('whatsapp_conversations').update({
        last_message: msgContent,
        last_message_at: new Date().toISOString(),
        unread_count: (existingConv.unread_count || 0) + 1,
        status: 'open',
      }).eq('id', conversationId)
    } else {
      const { data: newConv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          customer_phone: phone,
          customer_name: name,
          last_message: msgContent,
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          status: 'open',
        })
        .select('id')
        .single()

      if (convError) throw convError
      conversationId = newConv.id
    }

    // Insert the message
    const { error: msgError } = await supabase.from('whatsapp_messages').insert({
      conversation_id: conversationId,
      direction: 'incoming',
      content: msgContent,
      message_type: 'text',
      status: 'received',
    })

    if (msgError) throw msgError

    return new Response(JSON.stringify({
      success: true,
      conversation_id: conversationId,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('WhatsApp lead error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})