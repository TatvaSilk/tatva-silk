import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(req: Request) {
  try {
    const body = await req.json()

    const {
      id,
      title,
      text,
      cta_label,
      cta_href,
      img,
      sort_order,
      is_active,
    } = body

    if (!id || !title || !img) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('home_banners')
      .update({
        title,
        text,
        cta_label,
        cta_href,
        img,
        sort_order,
        is_active,
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    )
  }
}
``
