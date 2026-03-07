import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop() // e.g. "orders" or "incomplete-orders"
    const apiKey = req.headers.get('x-api-key')

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing X-API-Key header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'Invalid or inactive API key' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update last_used_at
    await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyData.id)

    const permissions: string[] = keyData.permissions || []

    // Handle GET - list orders
    if (req.method === 'GET') {
      const type = url.searchParams.get('type') || 'orders'
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const status = url.searchParams.get('status')

      if (type === 'incomplete_orders') {
        if (!permissions.includes('incomplete_orders:read') && !permissions.includes('incomplete_orders:create')) {
          return new Response(JSON.stringify({ error: 'Permission denied: incomplete_orders:read' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        let query = supabase.from('incomplete_orders').select('*').order('created_at', { ascending: false }).limit(limit)
        if (status) query = query.eq('status', status)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, data, count: data.length }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!permissions.includes('orders:read') && !permissions.includes('orders:create')) {
        return new Response(JSON.stringify({ error: 'Permission denied: orders:read' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit)
      if (status) query = query.eq('status', status)
      const { data, error } = await query
      if (error) throw error
      return new Response(JSON.stringify({ success: true, data, count: data.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle POST - create order
    if (req.method === 'POST') {
      const body = await req.json()
      const type = body.type || 'order' // 'order' or 'incomplete_order'

      if (type === 'incomplete_order') {
        if (!permissions.includes('incomplete_orders:create')) {
          return new Response(JSON.stringify({ error: 'Permission denied: incomplete_orders:create' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data, error } = await supabase.from('incomplete_orders').insert({
          customer_name: body.customer_name,
          customer_phone: body.customer_phone || null,
          customer_address: body.customer_address || null,
          product_name: body.product_name || null,
          product_code: body.product_code || null,
          quantity: body.quantity || 1,
          unit_price: body.unit_price || 0,
          total_amount: body.total_amount || 0,
          delivery_charge: body.delivery_charge || 0,
          discount: body.discount || 0,
          notes: body.notes || null,
          block_reason: body.block_reason || 'api_submission',
          status: body.status || 'processing',
          landing_page_slug: body.source || null,
          client_ip: body.client_ip || null,
          user_agent: body.user_agent || null,
          device_info: body.device_info || null,
        }).select().single()

        if (error) throw error
        return new Response(JSON.stringify({ success: true, data, message: 'Incomplete order created' }), {
          status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Create regular order
      if (!permissions.includes('orders:create')) {
        return new Response(JSON.stringify({ error: 'Permission denied: orders:create' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Generate order number
      const { data: lastOrder } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)

      let nextNum = 'ORD-00001'
      if (lastOrder && lastOrder.length > 0) {
        const lastNum = parseInt(lastOrder[0].order_number.replace(/\D/g, '') || '0')
        nextNum = `ORD-${String(lastNum + 1).padStart(5, '0')}`
      }

      const { data: orderData, error: orderError } = await supabase.from('orders').insert({
        order_number: body.order_number || nextNum,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone || null,
        customer_address: body.customer_address || null,
        product_cost: body.product_cost || 0,
        delivery_charge: body.delivery_charge || 0,
        discount: body.discount || 0,
        total_amount: body.total_amount || 0,
        status: body.status || 'processing',
        notes: body.notes || null,
        client_ip: body.client_ip || null,
        user_agent: body.user_agent || null,
        device_info: body.device_info || null,
        source: body.source || keyData.label || null,
      }).select().single()

      if (orderError) throw orderError

      // Insert order items if provided
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        const itemRows = body.items.map((item: any) => ({
          order_id: orderData.id,
          product_name: item.product_name || 'Unknown',
          product_code: item.product_code || '',
          product_id: item.product_id || null,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total_price: item.total_price || 0,
        }))
        await supabase.from('order_items').insert(itemRows)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: orderData, 
        order_number: orderData.order_number,
        message: 'Order created successfully' 
      }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Order API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
