import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { orderNo } = await req.json()

    if (!orderNo) {
      return NextResponse.json(
        { error: 'Order number missing' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('orders')
      .select('id, invoice_no, grand_total, shipping_phone')
      .eq('order_no', orderNo)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
