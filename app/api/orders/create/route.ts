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

    // ✅ Validate
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

    /* ================= CUSTOMER PROFILE ================= */

    // 1️⃣ Try existing profile
    let profileId: string | null = null

    const { data: existingProfile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('phone', customer.phone)
      .maybeSingle()

    if (existingProfile) {
      profileId = existingProfile.id
    } else {
      // 2️⃣ Create new profile
      const { data: createdProfile, error } = await supabase
        .from('customer_profiles')
        .insert({
          full_name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
        })
        .select('id')
        .single()

      if (error || !createdProfile) {
        throw new Error('Failed to create customer profile')
      }

      profileId = createdProfile.id
    }

    // ✅ TypeScript now KNOWS this is not null
    if (!profileId) {
      throw new Error('Customer profile ID missing')
    }

    /* ================= CREATE ORDER ================= */

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: profileId, // ✅ TS safe ✅ FK safe
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

    if (orderError || !order) {
      throw orderError || new Error('Order creation failed')
    }

    /* ================= ORDER ITEMS ================= */

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
