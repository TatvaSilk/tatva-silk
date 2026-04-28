export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/* ================= SUPABASE ================= */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/* ================= ROUTE ================= */

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ref = params.id

  // ✅ Step 1: try UUID id
  let { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      shipping_name,
      shipping_phone,
      shipping_address,
      order_items (
        name,
        price,
        qty
      )
    `)
    .eq('id', ref)
    .maybeSingle()

  // ✅ Step 2: fallback to order_no
  if (!order) {
    const res = await supabase
      .from('orders')
      .select(`
        id,
        order_no,
        created_at,
        grand_total,
        shipping_name,
        shipping_phone,
        shipping_address,
        order_items (
          name,
          price,
          qty
        )
      `)
      .eq('order_no', ref)
      .maybeSingle()

    order = res.data
  }

  // ❌ Step 3: real error
  if (!order) {
    return new NextResponse(
      `Order not found for reference: ${ref}`,
      { status: 404 }
    )
  }

  // ✅ TEMP RESPONSE (to confirm fix)
  return new NextResponse(
    JSON.stringify({
      success: true,
      order_id: order.id,
      order_no: order.order_no,
      customer: {
        name: order.shipping_name,
        phone: order.shipping_phone,
        address: order.shipping_address,
      },
      amount: order.grand_total,
      items: order.order_items,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
``
