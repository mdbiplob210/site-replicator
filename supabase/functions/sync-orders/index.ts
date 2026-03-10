import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // Authenticate admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { api_key_id } = body

    if (!api_key_id) {
      return new Response(JSON.stringify({ error: 'api_key_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get API key with source_url
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', api_key_id)
      .eq('is_active', true)
      .single()

    if (keyError || !keyData) {
      return new Response(JSON.stringify({ error: 'API Key not found or inactive' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!keyData.source_url) {
      return new Response(JSON.stringify({ error: 'No source URL configured for this API key' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const fetchUrl = keyData.source_url
    const fetchHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-Key': keyData.api_key,
    }

    // Fetch orders from external source
    let externalOrders: any[] = []

    try {
      const extResponse = await fetch(fetchUrl, {
        method: 'GET',
        headers: fetchHeaders,
      })

      if (!extResponse.ok) {
        throw new Error(`External API returned ${extResponse.status}: ${extResponse.statusText}`)
      }

      const extData = await extResponse.json()
      
      // Support different response formats
      if (Array.isArray(extData)) {
        externalOrders = extData
      } else if (extData.data && Array.isArray(extData.data)) {
        externalOrders = extData.data
      } else if (extData.orders && Array.isArray(extData.orders)) {
        externalOrders = extData.orders
      } else {
        throw new Error('Unsupported response format. Expected array or {data:[]} or {orders:[]}')
      }
    } catch (fetchErr) {
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch from external source', 
        detail: fetchErr.message 
      }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let synced = 0
    let skipped = 0
    let errors: string[] = []

    for (const ext of externalOrders) {
      try {
        const customerName = ext.customer_name || ext.name || ext.customerName
        if (!customerName) {
          skipped++
          continue
        }

        const phone = ext.customer_phone || ext.phone || null
        const address = ext.customer_address || ext.address || null
        const deliveryCharge = ext.delivery_charge || 0
        const orderNumber = ext.order_number || null
        const discount = ext.discount || 0
        const notes = ext.notes || ext.note || null
        const totalAmount = ext.total_amount || ext.total || 0

        const isIncomplete = ext.type === 'incomplete_order' || ext.type === 'incomplete'

        if (isIncomplete) {
          // Check duplicate by phone + name
          let isDuplicate = false
          if (phone) {
            const { data: existing } = await supabase
              .from('incomplete_orders')
              .select('id')
              .eq('customer_phone', phone)
              .eq('customer_name', customerName)
              .limit(1)
            isDuplicate = (existing && existing.length > 0)
          }

          if (isDuplicate) {
            skipped++
            continue
          }

          await supabase.from('incomplete_orders').insert({
            customer_name: customerName,
            customer_phone: phone,
            customer_address: address,
            product_name: ext.product_name || null,
            product_code: ext.product_code || null,
            quantity: ext.quantity || 1,
            unit_price: ext.unit_price || 0,
            total_amount: totalAmount,
            delivery_charge: deliveryCharge,
            discount: discount,
            notes: notes,
            block_reason: ext.block_reason || 'api_sync',
            status: ext.status || 'processing',
            landing_page_slug: ext.source || keyData.label || null,
          })
          synced++
        } else {
          // Regular order — check duplicate
          let isDuplicate = false
          if (orderNumber) {
            const { data: existing } = await supabase
              .from('orders')
              .select('id')
              .eq('order_number', orderNumber.toString())
              .limit(1)
            isDuplicate = (existing && existing.length > 0)
          } else if (phone) {
            const { data: existing } = await supabase
              .from('orders')
              .select('id')
              .eq('customer_phone', phone)
              .eq('customer_name', customerName)
              .limit(1)
            isDuplicate = (existing && existing.length > 0)
          }

          if (isDuplicate) {
            skipped++
            continue
          }

          // Generate order number
          const { data: seqNum } = await supabase.rpc('generate_order_number')
          const nextNum = String(seqNum || Date.now())

          const { data: orderData, error: orderError } = await supabase.from('orders').insert({
            order_number: orderNumber || nextNum,
            customer_name: customerName,
            customer_phone: phone,
            customer_address: address,
            product_cost: ext.product_cost || 0,
            delivery_charge: deliveryCharge,
            discount: discount,
            total_amount: totalAmount,
            status: ext.status || 'processing',
            notes: notes,
            source: ext.source || keyData.label || 'API Sync',
          }).select().single()

          if (orderError) throw orderError

          // Insert items if provided
          const items = ext.items || ext.order_items || []
          if (Array.isArray(items) && items.length > 0 && orderData) {
            const itemRows = []
            for (const item of items) {
              const productName = item.product_name || item.name || 'Unknown'
              const productCode = item.product_code || item.code || ''
              const unitPrice = item.unit_price || item.price || 0
              const imageUrl = item.image_url || item.image || item.main_image_url || null
              let productId = item.product_id || null

              // Auto-create products
              if (productCode && !productId) {
                const { data: existingProduct } = await supabase
                  .from('products').select('id').eq('product_code', productCode).limit(1).single()
                if (existingProduct) {
                  productId = existingProduct.id
                } else {
                  const { data: nameMatch } = await supabase
                    .from('products').select('id').eq('name', productName).limit(1).single()
                  if (nameMatch) {
                    productId = nameMatch.id
                  } else {
                    const { data: newProduct } = await supabase.from('products').insert({
                      name: productName, product_code: productCode, selling_price: unitPrice,
                      original_price: item.original_price || unitPrice,
                      purchase_price: item.purchase_price || 0,
                      main_image_url: imageUrl, status: 'active', stock_quantity: 0,
                    }).select('id').single()
                    if (newProduct) productId = newProduct.id
                  }
                }
              } else if (!productCode && productName !== 'Unknown' && !productId) {
                const { data: nameMatch } = await supabase
                  .from('products').select('id').eq('name', productName).limit(1).single()
                if (nameMatch) {
                  productId = nameMatch.id
                } else {
                  const autoCode = 'AUTO-' + productName.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20).toUpperCase() + '-' + Date.now().toString(36)
                  const { data: newProduct } = await supabase.from('products').insert({
                    name: productName, product_code: autoCode, selling_price: unitPrice,
                    original_price: item.original_price || unitPrice,
                    purchase_price: item.purchase_price || 0,
                    main_image_url: imageUrl, status: 'active', stock_quantity: 0,
                  }).select('id').single()
                  if (newProduct) productId = newProduct.id
                }
              }

              itemRows.push({
                order_id: orderData.id, product_name: productName, product_code: productCode,
                product_id: productId, quantity: item.quantity || 1, unit_price: unitPrice,
                total_price: item.total_price || item.total || (unitPrice * (item.quantity || 1)),
              })
            }
            await supabase.from('order_items').insert(itemRows)
          }
          synced++
        }
      } catch (err) {
        errors.push(err.message || 'Unknown error')
      }
    }

    // Update last_synced_at
    await supabase.from('api_keys').update({ last_synced_at: new Date().toISOString() }).eq('id', api_key_id)

    return new Response(JSON.stringify({
      success: true,
      total_found: externalOrders.length,
      synced,
      skipped,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      message: `${synced} orders synced, ${skipped} duplicates skipped`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sync error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})