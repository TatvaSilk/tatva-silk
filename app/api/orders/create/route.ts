import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Safely parse JSON
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate input
    const { customer_id, amount, payment_status } = body

    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      )
    }

    // ✅ FIXED OPERATOR HERE
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    if (!payment_status) {
      return NextResponse.json(
        { error: 'payment_status is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const orderNo = `ORDER-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)
      .toUpperCase()}`

    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        customer_id,
        items_count: 1,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,
        payment_status,
        status: 'placed', // ✅ matches enum
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        orderNo: data.order_no,
        orderId: data.id,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
