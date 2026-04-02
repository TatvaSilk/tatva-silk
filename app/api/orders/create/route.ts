import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ MUST use service role
    )

    const {
      items,
      amount,
      payment_method,
      payment_status,
      customer,
      address,
      upi,
    } = body

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: `TS-${Date.now()}`,
        items_count: items.length,
        subtotal: amount,
        grand_total: amount,
        payment_method,
        payment_status,
        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,
        shipping_address_line2: address.line2,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode,
        metadata: { items, upi },
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderNo: data.order_no,
    })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
