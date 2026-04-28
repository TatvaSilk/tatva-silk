export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ FIX
)

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const orderRef = params.id

  let { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      status,
      customer_id,
      order_items (
        name,
        price,
        qty
      )
    `)
    .eq('id', orderRef)
    .single()

  if (!order) {
    const res = await supabase
      .from('orders')
      .select(`
        id,
        order_no,
        created_at,
        grand_total,
        status,
        customer_id,
        order_items (
          name,
          price,
          qty
        )
      `)
      .eq('order_no', orderRef)
      .single()
    order = res.data
  }

  if (!order) {
    return new NextResponse('Order not found', { status: 404 })
  }

  return new NextResponse('Invoice OK') // simplified for now
}
