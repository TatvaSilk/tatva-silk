import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Parse request body with error handling
    let body
    try {
      body = await req.json()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Validate required request fields
    const { customer_id, amount, payment_status } = body

    if (!customer_id) {
      return NextResponse.json(
        { error: 'customer_id is required' },
        { status: 400 }
      )
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generate unique order number
    const orderNo = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`

    // Insert order into database
    const { data, error } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        customer_id: customer_id,
        items_count: 1,
        subtotal: amount,
        delivery_fee: 0,
        discount: 0,
        grand_total: amount,
        payment_status: payment_status,
        status: 'placed',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, orderNo: data.order_no, orderId: data.id },
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
