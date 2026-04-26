import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customer_id,
      email,
      cartItems,   // [{ id, qty }]
      shipping,
    } = body

    // ✅ 1. Re-fetch products from DB (SECURITY)
    const productIds = cartItems.map((i: any) => i.id)

    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, price')
      .in('id', productIds)

    if (productError || !products) {
      return NextResponse.json({ error: 'Invalid products' }, { status: 400 })
    }

    // ✅ 2. Build order items using DB prices (RUPEES)
    const orderItems = cartItems.map((item: any) => {
      const product = products.find(p => p.id === item.id)
      if (!product) {
        throw new Error('Product not found')
      }

      return {
        product_id: product.id,
        name: product.name,
        price: product.price, // ✅ rupees from DB
        qty: item.qty,
        line_total: product.price * item.qty,
      }
    })

    // ✅ 3. Calculate totals (RUPEES)
    const subtotal = orderItems.reduce(
      (sum, i) => sum + i.line_total,
      0
    )

    const delivery_fee = 99   // ₹99 delivery
    const discount = 0

    const grand_total = subtotal + delivery_fee - discount

    // ✅ 4. Create order
    const order_no = `TS-${Date.now()}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no,
        customer_id,
        email,
        items_count: orderItems.length,
        subtotal,
        delivery_fee,
        discount,
        grand_total,
        payment_status: 'cod_pending',
        status: 'placed',
        shipping_name: shipping.name,
        shipping_phone: shipping.phone,
        shipping_address_line1: shipping.address1,
        shipping_address_line2: shipping.address2 ?? null,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_pin: shipping.pin,
      })
      .select()
      .single()

    if (orderError) {
      console.error(orderError)
      return NextResponse.json({ error: 'Order insert failed' }, { status: 500 })
    }

    // ✅ 5. Insert order items
    const itemsWithOrderId = orderItems.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      name: i.name,
      price: i.price,     // ✅ rupees
      qty: i.qty,
    }))

    const { error: itemError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemError) {
      console.error(itemError)
      return NextResponse.json({ error: 'Order items insert failed' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_no,
      grand_total,
    })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: 'Checkout failed' },
      { status: 500 }
    )
  }
}
