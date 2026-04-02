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

    // ✅ Service-role client (bypasses RLS)
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ User-scoped client (who placed the order)
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // ✅ Get logged-in user from request cookies
    const { data: { user }, error: userErr } =
      await userClient.auth.getUser()

    if (userErr || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const orderNo = `TS-${Date.now()}`

    const { data, error } = await admin
      .from('orders')
      .insert({
        order_no: orderNo,

        // ✅ THIS IS THE CRITICAL FIX
        customer_id: user.id,

        items_count: items.length,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,

        payment_status: payment_status ?? 'unpaid',
        status: 'placed',

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
      console.error(error)
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
    console.error(e)
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
