import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ orders: [] })
  }

  // ✅ Find all customer profiles for this email
  const { data: profiles } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('email', email)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ orders: [] })
  }

  const profileIds = profiles.map(p => p.id)

  // ✅ Fetch orders + items (same as admin)
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
        name,
        price,
        qty,
        product_id
      )
    `)
    .in('customer_id', profileIds)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
}
