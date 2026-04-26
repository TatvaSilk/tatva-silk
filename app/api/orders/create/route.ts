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

    // ✅ Safe validation
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

    // ✅ 1. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: `TS-${Date.now()}`,
        customer_id,
        items_count: items.length,
        subtotal: amount,
        delivery_fee,
        discount: 0,
        grand_total: amount + delivery_fee,
        payment_status: payment_status ?? 'cod_pending',
        status: 'placed',

        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,     // Street / House
        shipping_address_line2: address.village,   // Village / Town
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

    // ✅ 2. Insert Order Items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name,
      price: item.price,
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

    // ✅ 3. 🔔 ADMIN EMAIL NOTIFICATION (Resend)
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TatvaSilk Orders <orders@tatvasilk.com>',
          to: [process.env.ADMIN_EMAIL],
          subject: `🛒 New Order Received: ${order.order_no}`,
          html: `
            <h2>New Order Received</h2>
            <p><strong>Order No:</strong> ${order.order_no}</p>
            <p><strong>Total:</strong> ₹${order.grand_total}</p>
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>

            <hr />

            <h3>Shipping Address</h3>
            <p>
              ${address.line1}<br/>
              ${address.village}<br/>
              ${address.city}, ${address.state} - ${address.pincode}
            </p>
          `,
        }),
      })
    } catch (emailError) {
      // ❗ Do NOT fail order if email fails
      console.error('Admin email failed:', emailError)
    }

    // ✅ 4. Success Response
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
