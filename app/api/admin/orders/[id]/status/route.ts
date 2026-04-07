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
        { error: 'Missing status' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ✅ EXPLICIT update + return row
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', params.id)
      .select('*')

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'UPDATE ran but no rows changed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: data[0],
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    )
  }
}
``
