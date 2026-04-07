import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log('📦 Order request body:', body)

    const {
      customer_id,
      items,
      amount,
      payment_status,
      customer,
      address
    } = body

    console.log('👤 customer_id:', customer_id)

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
        items_count: items?.length ?? 0,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,
        payment_status,
        status: 'placed',
        shipping_name: customer?.name,
        shipping_phone: customer?.phone,
        shipping_address_line1: address?.line1,
        shipping_address_line2: address?.line2,
        shipping_city: address?.city,
        shipping_state: address?.state,
        shipping_pin: address?.pincode,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ SUPABASE INSERT ERROR:', error)
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      )
    }

    console.log('✅ Order created:', data)

    return NextResponse.json({
      success: true,
      orderNo: data.order_no,
    })
  } catch (e: any) {
    console.error('🔥 API CRASH:', e)
    return NextResponse.json(
      { error: e.message || 'Server error', stack: e },
      { status: 500 }
    )
  }
}
