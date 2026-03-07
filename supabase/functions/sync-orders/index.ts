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
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = claims.claims.sub as string

    // Check admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
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

    // Fetch orders from external source
    const sourceUrl = keyData.source_url
    let externalOrders: any[] = []

    try {
      const extResponse = await fetch(sourceUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': keyData.api_key,
          'Accept': 'application/json',
        },
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

        const isIncomplete = ext.type === 'incomplete_order' || ext.type === 'incomplete'

        if (isIncomplete) {
          // Check duplicate by phone + created_at (approximate)
          const phone = ext.customer_phone || ext.phone || null
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
            customer_phone: ext.customer_phone || ext.phone || null,
            customer_address: ext.customer_address || ext.address || null,
            product_name: ext.product_name || null,
            product_code: ext.product_code || null,
            quantity: ext.quantity || 1,
            unit_price: ext.unit_price || 0,
            total_amount: ext.total_amount || ext.total || 0,
            delivery_charge: ext.delivery_charge || 0,
            discount: ext.discount || 0,
            notes: ext.notes || null,
            block_reason: ext.block_reason || 'api_sync',
            status: ext.status || 'processing',
            landing_page_slug: ext.source || keyData.label || null,
          })
          synced++
        } else {
          // Regular order — check duplicate by external_id or phone+name
          const externalId = ext.id || ext.external_id || ext.order_id
          const phone = ext.customer_phone || ext.phone || null
          
          let isDuplicate = false
          if (ext.order_number) {
            const { data: existing } = await supabase
              .from('orders')
              .select('id')
              .eq('order_number', ext.order_number)
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
            order_number: ext.order_number || nextNum,
            customer_name: customerName,
            customer_phone: phone,
            customer_address: ext.customer_address || ext.address || null,
            product_cost: ext.product_cost || 0,
            delivery_charge: ext.delivery_charge || 0,
            discount: ext.discount || 0,
            total_amount: ext.total_amount || ext.total || 0,
            status: ext.status || 'processing',
            notes: ext.notes || null,
            source: ext.source || keyData.label || 'API Sync',
          }).select().single()

          if (orderError) throw orderError

          // Insert items if provided & auto-create products
          const items = ext.items || ext.order_items || []
          if (Array.isArray(items) && items.length > 0 && orderData) {
            const itemRows = []
            for (const item of items) {
              const productName = item.product_name || item.name || 'Unknown'
              const productCode = item.product_code || item.code || ''
              const unitPrice = item.unit_price || item.price || 0
              const imageUrl = item.image_url || item.image || item.main_image_url || null
              let productId = item.product_id || null

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
                      original_price: item.original_price || item.regular_price || unitPrice,
                      purchase_price: item.purchase_price || item.cost_price || 0,
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
                    original_price: item.original_price || item.regular_price || unitPrice,
                    purchase_price: item.purchase_price || item.cost_price || 0,
                    main_image_url: imageUrl, status: 'active', stock_quantity: 0,
                  }).select('id').single()
                  if (newProduct) productId = newProduct.id
                }
              }

              itemRows.push({
                order_id: orderData.id, product_name: productName, product_code: productCode,
                product_id: productId, quantity: item.quantity || 1, unit_price: unitPrice,
                total_price: item.total_price || item.total || 0,
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
      message: `${synced} অর্ডার সিঙ্ক হয়েছে, ${skipped} ডুপ্লিকেট বাদ দেওয়া হয়েছে`
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
