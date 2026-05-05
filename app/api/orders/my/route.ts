import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  // ✅ Correct Supabase server client
  const supabase = createRouteHandlerClient({ cookies })

  // ✅ Get logged-in user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ orders: [] }, { status: 401 })
  }

  // ✅ RLS enforces customer_id = auth.uid()
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_no,
      created_at,
      grand_total,
      payment_status,
      status,
      order_items (
        id,
        product_id,
        name,
        price,
        qty
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ orders })
}
