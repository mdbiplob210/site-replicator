import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const courierSlug = url.searchParams.get('courier')
    
    if (!courierSlug) {
      return new Response(JSON.stringify({ error: 'Missing courier parameter' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const payload = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Log the webhook
    await supabase.from('courier_webhook_logs').insert({
      courier_slug: courierSlug,
      payload,
    })

    // Process based on courier type
    let trackingId: string | null = null
    let newStatus: string | null = null
    let orderStatus: string | null = null

    switch (courierSlug) {
      case 'pathao': {
        trackingId = payload.consignment_id || payload.tracking_id
        newStatus = payload.status || payload.delivery_status
        break
      }
      case 'redx': {
        trackingId = payload.tracking_id || payload.parcel_id
        newStatus = payload.status || payload.parcel_status
        break
      }
      case 'steadfast': {
        trackingId = payload.tracking_code || payload.consignment_id
        newStatus = payload.status || payload.delivery_status
        break
      }
      case 'ecourier': {
        trackingId = payload.ecr_id || payload.tracking_id
        newStatus = payload.status || payload.parcel_status
        break
      }
      default: {
        trackingId = payload.tracking_id || payload.consignment_id
        newStatus = payload.status
      }
    }

    if (trackingId && newStatus) {
      // Update courier_orders
      const { data: courierOrder } = await supabase
        .from('courier_orders')
        .update({ courier_status: newStatus, updated_at: new Date().toISOString() })
        .or(`tracking_id.eq.${trackingId},consignment_id.eq.${trackingId}`)
        .select('order_id')
        .maybeSingle()

      // Map courier status to order status
      if (courierOrder) {
        const statusLower = newStatus.toLowerCase()
        if (statusLower.includes('deliver')) {
          orderStatus = 'delivered'
        } else if (statusLower.includes('return') || statusLower.includes('rts')) {
          orderStatus = 'returned'
        } else if (statusLower.includes('cancel')) {
          orderStatus = 'cancelled'
        } else if (statusLower.includes('transit') || statusLower.includes('pickup') || statusLower.includes('hub')) {
          orderStatus = 'in_courier'
        }

        if (orderStatus) {
          await supabase
            .from('orders')
            .update({ status: orderStatus, updated_at: new Date().toISOString() })
            .eq('id', courierOrder.order_id)
        }
      }

      // Mark webhook as processed
      await supabase
        .from('courier_webhook_logs')
        .update({ processed: true })
        .eq('courier_slug', courierSlug)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
