import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-auth-token',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const courierSlug = url.searchParams.get('courier')
    const authToken = req.headers.get('x-auth-token') || url.searchParams.get('token')

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

    // Always require and validate auth token
    if (!authToken) {
      return new Response(JSON.stringify({ error: 'Missing auth token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: provider } = await supabase
      .from('courier_providers')
      .select('id')
      .eq('slug', courierSlug)
      .eq('auth_token', authToken)
      .eq('is_active', true)
      .single()
    
    if (!provider) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Log the webhook
    await supabase.from('courier_webhook_logs').insert({
      courier_slug: courierSlug,
      payload,
    })

    // Process based on courier type
    let trackingId: string | null = null
    let newStatus: string | null = null
    let orderStatus: string | null = null
    let deliveryFee: number | null = null
    let codAmount: number | null = null
    let weight: string | null = null
    let area: string | null = null
    let hubName: string | null = null
    let riderName: string | null = null
    let riderPhone: string | null = null
    let deliveryDate: string | null = null
    let returnReason: string | null = null

    switch (courierSlug) {
      case 'pathao': {
        trackingId = payload.consignment_id || payload.tracking_id
        newStatus = payload.status || payload.delivery_status
        deliveryFee = payload.delivery_fee || payload.total_fee || null
        codAmount = payload.cod_amount || payload.amount_to_collect || null
        weight = payload.item_weight || null
        area = payload.recipient_area || payload.delivery_area || null
        riderName = payload.rider_name || null
        riderPhone = payload.rider_phone || null
        deliveryDate = payload.delivered_at || payload.updated_at || null
        returnReason = payload.return_reason || null
        break
      }
      case 'redx': {
        trackingId = payload.tracking_id || payload.parcel_id
        newStatus = payload.status || payload.parcel_status
        deliveryFee = payload.delivery_charge || payload.charge || null
        codAmount = payload.cash_collection_amount || payload.cod_amount || null
        weight = payload.weight || null
        area = payload.area || payload.district || null
        riderName = payload.pickup_man_name || payload.rider_name || null
        riderPhone = payload.pickup_man_phone || payload.rider_phone || null
        deliveryDate = payload.delivered_at || null
        returnReason = payload.cancel_reason || null
        break
      }
      case 'steadfast': {
        trackingId = payload.tracking_code || payload.consignment_id || payload.invoice
        newStatus = payload.status || payload.delivery_status
        deliveryFee = payload.charge || payload.delivery_charge || null
        codAmount = payload.cod_amount || payload.amount || null
        area = payload.district || payload.thana || null
        riderName = payload.rider_name || null
        riderPhone = payload.rider_phone || null
        deliveryDate = payload.delivery_date || null
        returnReason = payload.note || null
        break
      }
      case 'ecourier': {
        trackingId = payload.ecr_id || payload.tracking_id || payload.ecr
        newStatus = payload.status || payload.parcel_status || payload.comment
        deliveryFee = payload.charge || payload.delivery_charge || null
        codAmount = payload.product_price || payload.cod_amount || null
        area = payload.to_district || payload.district || null
        riderName = payload.rider || null
        deliveryDate = payload.updated_at || null
        returnReason = payload.comment || null
        break
      }
      default: {
        trackingId = payload.tracking_id || payload.consignment_id
        newStatus = payload.status
        deliveryFee = payload.delivery_fee || payload.charge || null
        codAmount = payload.cod_amount || null
      }
    }

    if (trackingId && newStatus) {
      // Build extended courier response with all tracked data
      const extendedData: Record<string, any> = {}
      if (deliveryFee !== null) extendedData.delivery_fee = deliveryFee
      if (codAmount !== null) extendedData.cod_amount = codAmount
      if (weight) extendedData.weight = weight
      if (area) extendedData.area = area
      if (hubName) extendedData.hub_name = hubName
      if (riderName) extendedData.rider_name = riderName
      if (riderPhone) extendedData.rider_phone = riderPhone
      if (deliveryDate) extendedData.delivery_date = deliveryDate
      if (returnReason) extendedData.return_reason = returnReason

      // Update courier_orders
      const { data: courierOrder } = await supabase
        .from('courier_orders')
        .update({ 
          courier_status: newStatus, 
          updated_at: new Date().toISOString(),
          courier_response: { ...extendedData, raw_status: newStatus, last_webhook: new Date().toISOString() }
        })
        .or(`tracking_id.eq.${trackingId},consignment_id.eq.${trackingId}`)
        .select('order_id, courier_provider_id')
        .maybeSingle()

      // Map courier status to order status
      if (courierOrder) {
        const statusLower = newStatus.toLowerCase()
        if (statusLower.includes('deliver') && !statusLower.includes('partial')) {
          orderStatus = 'delivered'
        } else if (statusLower.includes('return') || statusLower.includes('rts')) {
          orderStatus = 'pending_return'
        } else if (statusLower.includes('cancel')) {
          orderStatus = 'cancelled'
        } else if (statusLower.includes('transit') || statusLower.includes('pickup') || statusLower.includes('hub') || statusLower.includes('on_the_way')) {
          orderStatus = 'in_courier'
        }

        if (orderStatus) {
          await supabase
            .from('orders')
            .update({ status: orderStatus, updated_at: new Date().toISOString() })
            .eq('id', courierOrder.order_id)
        }

        // Update delivery_charge on price change
        if (deliveryFee !== null) {
          await supabase
            .from('orders')
            .update({ delivery_charge: deliveryFee })
            .eq('id', courierOrder.order_id)
        }

        // === AUTO-GENERATE INVOICE ON DELIVERY ===
        if (orderStatus === 'delivered') {
          // Fetch order details with items
          const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', courierOrder.order_id)
            .single()

          const { data: orderItems } = await supabase
            .from('order_items')
            .select('product_name, product_code, quantity, unit_price, total_price')
            .eq('order_id', courierOrder.order_id)

          if (order) {
            // Generate invoice number: INV-YYYYMMDD-XXXX
            const now = new Date()
            const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
            const random = Math.floor(Math.random() * 9000) + 1000
            const invoiceNumber = `INV-${dateStr}-${random}`

            const subtotal = Number(order.product_cost) || 0
            const finalDeliveryCharge = (deliveryFee ?? Number(order.delivery_charge)) || 0
            const finalDiscount = Number(order.discount) || 0
            const finalTotal = Number(order.total_amount) || 0
            const finalCod = (codAmount ?? finalTotal)

            // Upsert invoice (one per order)
            await supabase
              .from('invoices')
              .upsert({
                order_id: courierOrder.order_id,
                invoice_number: invoiceNumber,
                courier_provider_id: courierOrder.courier_provider_id,
                courier_tracking_id: trackingId,
                customer_name: order.customer_name,
                customer_phone: order.customer_phone,
                customer_address: order.customer_address,
                subtotal,
                delivery_charge: finalDeliveryCharge,
                discount: finalDiscount,
                cod_amount: finalCod,
                total_amount: finalTotal,
                delivery_date: deliveryDate ? new Date(deliveryDate).toISOString() : now.toISOString(),
                status: 'generated',
                items: orderItems || [],
              }, { onConflict: 'order_id' })
          }
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
