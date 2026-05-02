import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  // ✅ Create Supabase server client (NO service role)
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
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ orders: [] }, { status: 401 })
  }

  // ✅ Fetch ONLY that user's orders
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
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ orders })
}
