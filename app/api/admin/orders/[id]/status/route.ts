export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status: newStatus } = await req.json()

    if (!newStatus) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ 1. Get current order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const oldStatus = order.status

    // ✅ 2. Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    // ✅ 3. Deduct stock ONLY on transition → shipped
    if (oldStatus !== 'shipped' && newStatus === 'shipped') {
      // get ordered items
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, qty')
        .eq('order_id', params.id)

      if (itemsError) {
        return NextResponse.json(
          { error: 'Failed to load order items' },
          { status: 500 }
        )
      }

      // ✅ deduct stock per item
      for (const item of items ?? []) {
        const { error: stockError } = await supabase
          .rpc('decrease_stock_qty', {
            p_product_id: item.product_id,
            p_qty: item.qty,
          })

        if (stockError) {
          return NextResponse.json(
            { error: stockError.message },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
