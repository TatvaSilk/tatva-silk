import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  // ✅ Supabase server client (NO service role key)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
      },
    }
  )

  // ✅ Get logged-in user
  const { data: { user }, error: authError } =
    await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json(
      { orders: [] },
      { status: 401 }
    )
  }

  // ✅ RLS automatically restricts by customer_id
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
