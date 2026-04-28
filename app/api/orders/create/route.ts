import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ bypasses RLS
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      customer,
      address,
      items,
      subtotal,
      delivery_fee,
      grand_total,
    } = body

    // ✅ Validate incoming data
    if (
      !customer?.name ||
      !customer?.phone ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !address
    ) {
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      )
    }

    /* ================= CREATE / GET CUSTOMER PROFILE ================= */

    let { data: profile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('phone', customer.phone)
      .maybeSingle()

    if (!profile) {
      const { data: created, error } = await supabase
        .from('customer_profiles')
        .insert({
          full_name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
        })
        .select()
        .single()

      if (error) throw error
      profile = created
    }

    /* ================= CREATE ORDER ================= */

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: profile.id, // ✅ FK SAFE
        order_no: `TS-${Date.now()}`,
        items_count: items.length,
        subtotal,
        delivery_fee,
        discount: 0,
        grand_total,
        payment_status: 'cod_pending',
        status: 'placed',

        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,
        shipping_address_line2: address.village,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode,
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    /* ================= INSERT ORDER ITEMS ================= */

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

    if (itemsError) throw itemsError

    /* ================= ADMIN EMAIL (OPTIONAL) ================= */

    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'TatvaSilk Orders <orders@tatvasilk.com>',
          to: [process.env.ADMIN_EMAIL!],
          subject: `🛒 New Order Received: ${order.order_no}`,
          html: `
            <h2>New Order Received</h2>
            <p><strong>Order No:</strong> ${order.order_no}</p>
            <p><strong>Total:</strong> ₹${order.grand_total}</p>
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>
            <hr />
            <p>
              ${address.line1}<br/>
              ${address.village}<br/>
              ${address.city}, ${address.state} - ${address.pincode}
            </p>
          `,
        }),
      })
    } catch (e) {
      console.error('Admin email failed', e)
    }

    /* ================= SUCCESS ================= */

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNo: order.order_no,
    })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
