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
    const { customer_phone, customer_name, message, product_name } = body

    if (!customer_phone) {
      return new Response(JSON.stringify({ error: 'customer_phone is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if conversation already exists for this phone
    const { data: existingConv } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('customer_phone', customer_phone)
      .limit(1)
      .maybeSingle()

    let conversationId: string

    if (existingConv) {
      conversationId = existingConv.id
      // Update conversation
      await supabase.from('whatsapp_conversations').update({
        last_message: message || `${product_name} সম্পর্কে জানতে চাই`,
        last_message_at: new Date().toISOString(),
        unread_count: (await supabase.from('whatsapp_conversations').select('unread_count').eq('id', conversationId).single()).data?.unread_count + 1 || 1,
        status: 'open',
      }).eq('id', conversationId)
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('whatsapp_conversations')
        .insert({
          customer_phone,
          customer_name: customer_name || null,
          last_message: message || `${product_name} সম্পর্কে জানতে চাই`,
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
    const msgContent = message || (product_name
      ? `আমি "${product_name}" প্রোডাক্টটি সম্পর্কে জানতে চাই।`
      : 'হ্যালো, আমি আপনাদের প্রোডাক্ট সম্পর্কে জানতে চাই।')

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
      message: 'Conversation created/updated',
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