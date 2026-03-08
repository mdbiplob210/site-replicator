import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

// Parse device/browser/OS info from user-agent
function parseDeviceInfo(userAgent: string): { device: string; os: string; browser: string; deviceInfo: string } {
  if (!userAgent) return { device: 'Unknown', os: 'Unknown', browser: 'Unknown', deviceInfo: 'Unknown Device' }
  
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const isTablet = /iPad|Tablet/i.test(userAgent)
  const device = isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop'

  let os = 'Unknown OS'
  if (/Android/i.test(userAgent)) {
    const ver = userAgent.match(/Android\s([\d.]+)/)?.[1] || ''
    os = `Android ${ver}`.trim()
  } else if (/iPhone|iPad/i.test(userAgent)) {
    const ver = userAgent.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, '.') || ''
    os = `iOS ${ver}`.trim()
  } else if (/Mac OS X/i.test(userAgent)) {
    const ver = userAgent.match(/Mac OS X\s([\d_.]+)/)?.[1]?.replace(/_/g, '.') || ''
    os = `macOS ${ver}`.trim()
  } else if (/Windows/i.test(userAgent)) {
    const ver = userAgent.match(/Windows NT\s([\d.]+)/)?.[1] || ''
    const winMap: Record<string, string> = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' }
    os = `Windows ${winMap[ver] || ver}`.trim()
  } else if (/Linux/i.test(userAgent)) os = 'Linux'

  let browser = 'Unknown Browser'
  if (/Edg\//i.test(userAgent)) browser = 'Edge'
  else if (/OPR|Opera/i.test(userAgent)) browser = 'Opera'
  else if (/Chrome/i.test(userAgent)) browser = 'Chrome'
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox'
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari'

  return { device, os, browser, deviceInfo: `${device} | ${os} | ${browser}` }
}

// Extract all tracking info from request
function extractTrackingInfo(req: Request, body: any) {
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('cf-connecting-ip') ||
                   req.headers.get('x-real-ip') ||
                   body.client_ip || 'unknown'
  const userAgent = req.headers.get('user-agent') || body.user_agent || ''
  const referer = req.headers.get('referer') || body.referer || null
  const { device, os, browser, deviceInfo } = parseDeviceInfo(userAgent)

  return {
    client_ip: clientIp,
    user_agent: userAgent,
    device_info: body.device_info || deviceInfo,
    referer,
    device_type: device,
    os_name: os,
    browser_name: browser,
  }
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

    // ═══════════════════════════════════════════════
    // GET — List orders
    // ═══════════════════════════════════════════════
    if (req.method === 'GET') {
      const type = url.searchParams.get('type') || 'orders'
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500)
      const offset = parseInt(url.searchParams.get('offset') || '0')
      const status = url.searchParams.get('status')
      const since = url.searchParams.get('since') // ISO date filter
      const phone = url.searchParams.get('phone')

      if (type === 'incomplete_orders') {
        if (!permissions.includes('incomplete_orders:read') && !permissions.includes('incomplete_orders:create')) {
          return new Response(JSON.stringify({ error: 'Permission denied: incomplete_orders:read' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        let query = supabase.from('incomplete_orders').select('*', { count: 'exact' })
          .order('created_at', { ascending: false }).range(offset, offset + limit - 1)
        if (status) query = query.eq('status', status)
        if (since) query = query.gte('created_at', since)
        if (phone) query = query.eq('customer_phone', phone)
        const { data, error, count } = await query
        if (error) throw error
        return new Response(JSON.stringify({ 
          success: true, data, 
          total: count, 
          returned: data?.length || 0,
          limit, offset 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!permissions.includes('orders:read') && !permissions.includes('orders:create')) {
        return new Response(JSON.stringify({ error: 'Permission denied: orders:read' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      let query = supabase.from('orders').select('*, order_items(*)', { count: 'exact' })
        .order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      if (status) query = query.eq('status', status)
      if (since) query = query.gte('created_at', since)
      if (phone) query = query.eq('customer_phone', phone)
      const { data, error, count } = await query
      if (error) throw error
      return new Response(JSON.stringify({ 
        success: true, data, 
        total: count,
        returned: data?.length || 0,
        limit, offset
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ═══════════════════════════════════════════════
    // POST — Create order with duplicate protection
    // ═══════════════════════════════════════════════
    if (req.method === 'POST') {
      const body = await req.json()
      const type = body.type || 'order'
      const tracking = extractTrackingInfo(req, body)

      const customerPhone = body.customer_phone || body.phone || null
      const customerName = body.customer_name || body.name

      if (!customerName) {
        return new Response(JSON.stringify({ error: 'customer_name is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ═══ Load fraud settings from DB ═══
      const { data: fraudSettings } = await supabase
        .from('fraud_settings')
        .select('*')
        .limit(1)
        .single()

      const protectionEnabled = fraudSettings?.protection_enabled || false
      const blockDuration = fraudSettings?.repeat_block_duration || '24h'
      const deviceFingerprintEnabled = fraudSettings?.device_fingerprint_enabled || false
      const deliveryRatioEnabled = fraudSettings?.delivery_ratio_enabled || false
      const minDeliveryRatio = fraudSettings?.min_delivery_ratio || 0
      const blockPopupMessage = fraudSettings?.block_popup_message || 'আপনি ইতিমধ্যে একটি অর্ডার করেছেন।'

      const durationMap: Record<string, number> = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 }
      const duplicateWindowHours = durationMap[blockDuration] || 24

      const totalAmount = body.total_amount || ((body.unit_price || 0) * (body.quantity || 1) + (body.delivery_charge || 0) - (body.discount || 0))

      // Helper to insert incomplete order
      const insertIncomplete = async (blockReason: string) => {
        const { data: incompleteData } = await supabase.from('incomplete_orders').insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: body.customer_address || body.address || null,
          product_name: body.product_name || null,
          product_code: body.product_code || null,
          quantity: body.quantity || 1,
          unit_price: body.unit_price || 0,
          total_amount: totalAmount,
          delivery_charge: body.delivery_charge || 0,
          discount: body.discount || 0,
          notes: body.notes || null,
          block_reason: blockReason,
          status: 'processing',
          landing_page_slug: body.source || keyData.label || null,
          client_ip: tracking.client_ip,
          user_agent: tracking.user_agent,
          device_info: tracking.device_info,
        }).select('id').single()
        return incompleteData
      }

      // ═══ Check permanent phone block ═══
      if (customerPhone) {
        const { data: phoneBlocked } = await supabase
          .from('blocked_phones')
          .select('id')
          .eq('phone_number', customerPhone)
          .limit(1)

        if (phoneBlocked && phoneBlocked.length > 0) {
          const incompleteData = await insertIncomplete(`স্থায়ীভাবে ব্লক করা নম্বর: ${customerPhone}`)
          return new Response(JSON.stringify({
            success: false, blocked: true, reason: 'permanently_blocked_phone',
            incomplete_order_id: incompleteData?.id || null,
            message: blockPopupMessage,
          }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // ═══ Check permanent IP block ═══
      if (tracking.client_ip !== 'unknown') {
        const { data: ipBlocked } = await supabase
          .from('blocked_ips')
          .select('id')
          .eq('ip_address', tracking.client_ip)
          .limit(1)

        if (ipBlocked && ipBlocked.length > 0) {
          const incompleteData = await insertIncomplete(`স্থায়ীভাবে ব্লক করা IP: ${tracking.client_ip}`)
          return new Response(JSON.stringify({
            success: false, blocked: true, reason: 'permanently_blocked_ip',
            incomplete_order_id: incompleteData?.id || null,
            message: blockPopupMessage,
          }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // ═══ Repeat order block (only if protection enabled) ═══
      let isDuplicate = false
      let blockReason = ''

      if (protectionEnabled && blockDuration !== 'off') {
        const windowAgo = new Date(Date.now() - duplicateWindowHours * 60 * 60 * 1000).toISOString()

        if (customerPhone) {
          const { data: phoneOrders } = await supabase
            .from('orders')
            .select('id, order_number, created_at')
            .eq('customer_phone', customerPhone)
            .gte('created_at', windowAgo)
            .limit(1)

          if (phoneOrders && phoneOrders.length > 0) {
            isDuplicate = true
            blockReason = `একই ফোন (${customerPhone}) থেকে ${duplicateWindowHours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`
          }
        }

        if (!isDuplicate && tracking.client_ip !== 'unknown') {
          const { data: ipOrders } = await supabase
            .from('orders')
            .select('id, order_number, created_at')
            .eq('client_ip', tracking.client_ip)
            .gte('created_at', windowAgo)
            .limit(1)

          if (ipOrders && ipOrders.length > 0) {
            isDuplicate = true
            blockReason = `একই IP (${tracking.client_ip}) থেকে ${duplicateWindowHours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`
          }
        }

        // Device fingerprint check
        if (!isDuplicate && deviceFingerprintEnabled) {
          const { data: deviceOrders } = await supabase
            .from('orders')
            .select('id')
            .eq('device_info', tracking.device_info)
            .gte('created_at', windowAgo)
            .limit(1)

          if (deviceOrders && deviceOrders.length > 0) {
            isDuplicate = true
            blockReason = `একই ডিভাইস থেকে ${duplicateWindowHours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`
          }
        }
      }

      if (isDuplicate) {
        const incompleteData = await insertIncomplete(blockReason)
        return new Response(JSON.stringify({
          success: false, blocked: true, duplicate: true,
          reason: blockReason,
          incomplete_order_id: incompleteData?.id || null,
          message: blockPopupMessage,
          tracking: { ip: tracking.client_ip, device: tracking.device_info }
        }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // ═══ Delivery ratio check ═══
      if (protectionEnabled && deliveryRatioEnabled && minDeliveryRatio > 0 && customerPhone) {
        const { data: custOrders } = await supabase
          .from('orders')
          .select('id, status')
          .eq('customer_phone', customerPhone)

        if (custOrders && custOrders.length >= 3) {
          const delivered = custOrders.filter((o: any) => o.status === 'delivered').length
          const ratio = Math.round((delivered / custOrders.length) * 100)
          if (ratio < minDeliveryRatio) {
            const incompleteData = await insertIncomplete(`ডেলিভারি রেশিও কম (${ratio}% < ${minDeliveryRatio}%)`)
            return new Response(JSON.stringify({
              success: false, blocked: true, reason: 'low_delivery_ratio',
              incomplete_order_id: incompleteData?.id || null,
              message: blockPopupMessage,
            }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
          }
        }
      }

      // ── Create incomplete_order (explicit type) ──
      if (type === 'incomplete_order') {
        if (!permissions.includes('incomplete_orders:create')) {
          return new Response(JSON.stringify({ error: 'Permission denied: incomplete_orders:create' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data, error } = await supabase.from('incomplete_orders').insert({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_address: body.customer_address || body.address || null,
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
          landing_page_slug: body.source || keyData.label || null,
          client_ip: tracking.client_ip,
          user_agent: tracking.user_agent,
          device_info: tracking.device_info,
        }).select().single()

        if (error) throw error
        return new Response(JSON.stringify({ 
          success: true, data, 
          message: 'Incomplete order created',
          tracking: { ip: tracking.client_ip, device: tracking.device_info }
        }), {
          status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // ── Create regular order ──
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
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: body.customer_address || body.address || null,
        product_cost: body.product_cost || 0,
        delivery_charge: body.delivery_charge || 0,
        discount: body.discount || 0,
        total_amount: body.total_amount || 0,
        status: body.status || 'processing',
        notes: body.notes || null,
        client_ip: tracking.client_ip,
        user_agent: tracking.user_agent,
        device_info: tracking.device_info,
        source: body.source || keyData.label || null,
      }).select().single()

      if (orderError) throw orderError

      // Insert order items if provided & auto-create products
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        const itemRows = []
        for (const item of body.items) {
          const productName = item.product_name || item.name || 'Unknown'
          const productCode = item.product_code || item.code || ''
          const unitPrice = item.unit_price || item.price || 0
          const imageUrl = item.image_url || item.image || item.main_image_url || null
          let productId = item.product_id || null

          // Auto-create product if product_code provided and not exists
          if (productCode && !productId) {
            const { data: existingProduct } = await supabase
              .from('products')
              .select('id')
              .eq('product_code', productCode)
              .limit(1)
              .single()

            if (existingProduct) {
              productId = existingProduct.id
            } else {
              // Check by name if no code match
              const { data: nameMatch } = await supabase
                .from('products')
                .select('id')
                .eq('name', productName)
                .limit(1)
                .single()

              if (nameMatch) {
                productId = nameMatch.id
              } else {
                // Create new product
                const { data: newProduct } = await supabase.from('products').insert({
                  name: productName,
                  product_code: productCode,
                  selling_price: unitPrice,
                  original_price: item.original_price || item.regular_price || unitPrice,
                  purchase_price: item.purchase_price || item.cost_price || 0,
                  main_image_url: imageUrl,
                  status: 'active',
                  stock_quantity: 0,
                }).select('id').single()

                if (newProduct) productId = newProduct.id
              }
            }
          } else if (!productCode && productName !== 'Unknown' && !productId) {
            // Fallback: check by name only
            const { data: nameMatch } = await supabase
              .from('products')
              .select('id')
              .eq('name', productName)
              .limit(1)
              .single()

            if (nameMatch) {
              productId = nameMatch.id
            } else {
              const autoCode = 'AUTO-' + productName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20).toUpperCase() + '-' + Date.now().toString(36)
              const { data: newProduct } = await supabase.from('products').insert({
                name: productName,
                product_code: autoCode,
                selling_price: unitPrice,
                original_price: item.original_price || item.regular_price || unitPrice,
                purchase_price: item.purchase_price || item.cost_price || 0,
                main_image_url: imageUrl,
                status: 'active',
                stock_quantity: 0,
              }).select('id').single()

              if (newProduct) productId = newProduct.id
            }
          }

          itemRows.push({
            order_id: orderData.id,
            product_name: productName,
            product_code: productCode,
            product_id: productId,
            quantity: item.quantity || 1,
            unit_price: unitPrice,
            total_price: item.total_price || item.total || unitPrice * (item.quantity || 1),
          })
        }
        await supabase.from('order_items').insert(itemRows)
      }

      return new Response(JSON.stringify({ 
        success: true, 
        data: orderData, 
        order_number: orderData.order_number,
        order_id: orderData.id,
        message: 'Order created successfully',
        tracking: {
          ip: tracking.client_ip,
          device: tracking.device_info,
          source: body.source || keyData.label || null,
        }
      }), {
        status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ═══════════════════════════════════════════════
    // PATCH — Update order status
    // ═══════════════════════════════════════════════
    if (req.method === 'PATCH') {
      const body = await req.json()
      const orderId = body.order_id || body.id
      const newStatus = body.status

      if (!orderId || !newStatus) {
        return new Response(JSON.stringify({ error: 'order_id and status are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      if (!permissions.includes('orders:update') && !permissions.includes('orders:create')) {
        return new Response(JSON.stringify({ error: 'Permission denied: orders:update' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }
      if (body.notes) updateData.notes = body.notes
      if (body.customer_address) updateData.customer_address = body.customer_address

      const { data, error } = await supabase.from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify({ success: true, data, message: 'Order updated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed. Use GET, POST, or PATCH.' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Order API error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
