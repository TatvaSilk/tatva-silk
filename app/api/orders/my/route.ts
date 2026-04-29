import { NextResponse } from 'next/server'import { NextResponse } from ' const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const { customerId } = await req.json()

  if (!customerId) {
    return NextResponse.json({ orders: [] })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      status,
      order_items (
        id,
        product_id,
        name,
        price,
        qty
      )
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders })
}
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
