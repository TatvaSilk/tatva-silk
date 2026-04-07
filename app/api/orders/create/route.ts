import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const body = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('orders')
    .insert({
      order_no: 'TEST-' + Date.now(),
      customer_id: body.customer_id,
      items_count: 1,
      subtotal: body.amount,
      delivery_fee: 0,
      discount: 0,
      grand_total: body.amount,
      payment_status: body.payment_status,
      status: 'placed',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, orderNo: data.order_no })
}
