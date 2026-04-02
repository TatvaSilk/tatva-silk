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

    if (!customer_id) {
      return NextResponse.json({ error: 'User not logged in' }, { status: 401 })
    }

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart empty' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const orderNo = `TS-${Date.now()}`

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
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
        shipping_address_line2: address.line2,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orderNo: data.order_no })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
