import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      items,
      amount,
      payment_status,
      customer,
      address,
    } = body

    if (!items || !items.length) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!customer?.name || !customer?.phone) {
      return NextResponse.json(
        { error: 'Customer details missing' },
        { status: 400 }
      )
    }

    if (!address?.line1 || !address?.city || !address?.state || !address?.pincode) {
      return NextResponse.json(
        { error: 'Delivery address incomplete' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // REQUIRED
    )

    const orderNo = `TS-${Date.now()}`

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        items_count: items.length,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,
        payment_status: payment_status ?? 'unpaid',
        status: 'placed', // matches order_status enum default
        shipping_name: customer.name,
        shipping_phone: customer.phone,
        shipping_address_line1: address.line1,
        shipping_address_line2: address.line2 ?? null,
        shipping_city: address.city,
        shipping_state: address.state,
        shipping_pin: address.pincode,
      })
      .select()
      .single()

    if (error) {
      console.error('Order insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      orderNo: data.order_no,
    })
  } catch (e: any) {
    console.error('Create order crash:', e)
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
``
