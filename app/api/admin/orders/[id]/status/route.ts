export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json()

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error, count } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', params.id)
      .select()   // IMPORTANT: forces execution + returns row

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'No rows updated (check RLS or id)' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, order: data[0] })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'Server error' },
      { status: 500 }
    )
  }
}
