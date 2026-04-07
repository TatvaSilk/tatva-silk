import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customer_id,
      items,
      amount,
      payment_status,
      customer,
      address
    } = body

    if (!customer_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1️⃣ Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: `TS-${Date.now()}`,
        customer_id,
        items_count: items.length,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,
        payment_status,
        status: 'placed',
        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,
        shipping_address_line2: address.line2 || null,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode,
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // 2️⃣ Create order_items records
    const orderItems = items.map((item: any) => {
      const lineTotal = item.price * item.qty

      return {
        order_id: order.id,
        product_id: item.productId,
        name: item.name,
        price: item.price,
        qty: item.qty,
        line_total: lineTotal,
      }
    })

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      return NextResponse.json(
        { error: 'Order created, but items failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderNo: order.order_no,
      orderId: order.id,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
