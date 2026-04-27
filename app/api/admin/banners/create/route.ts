import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ IMPORTANT
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      title,
      text,
      cta_label,
      cta_href,
      img,
      sort_order,
      is_active,
    } = body

    if (!title || !img) {
      return NextResponse.json(
        { error: 'Title and image are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase.from('home_banners').insert({
      title,
      text,
      cta_label,
      cta_href,
      img,
      sort_order,
      is_active,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    )
  }
}
