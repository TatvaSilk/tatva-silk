import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = createServerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ orders: [] }, { status: 401 })
  }

  const { data: orders, error } = await supabase
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
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders })
}
