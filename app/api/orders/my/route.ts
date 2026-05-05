import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')

  if (!authHeader) {
    return NextResponse.json({ orders: [] }, { status: 401 })
  }

  // ✅ Create Supabase client with JWT
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    }
  )

  // ✅ Validate user
  const { data: { user }, error: authError } =
    await supabase.auth.getUser()

  if (!user || authError) {
    return NextResponse.json({ orders: [] }, { status: 401 })
  }

  // ✅ RLS limits rows by customer_id
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
