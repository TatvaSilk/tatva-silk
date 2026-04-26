import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customer_id,
      items,
      amount,
      delivery_fee,
      payment_status,
      customer,
      address,
    } = body

    // ✅ SAFE VALIDATION (NO MORE FALSE ERRORS)
    if (
      !customer_id ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !customer ||
      !address
    ) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ CREATE ORDER
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: `TS-${Date.now()}`,
        customer_id,
        items_count: items.length,
        subtotal: amount,                 // ✅ RUPEES
        delivery_fee: delivery_fee ?? 0,  // ✅ RUPEES
        discount: 0,
        grand_total: amount + (delivery_fee ?? 0),
        payment_status: payment_status ?? 'cod_pending',
        status: 'placed',

        // ✅ SHIPPING DETAILS
        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,     // Street / House
        shipping_address_line2: address.village,   // ✅ Village / Town
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { error: orderError.message },
        { status: 500 }
      )
    }

    // ✅ INSERT ORDER ITEMS
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      price: item.price,   // ✅ RUPEES
      qty: item.qty,
      line_total: item.price * item.qty,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Order saved but items failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderNo: order.order_no,
      orderId: order.id,
    })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
