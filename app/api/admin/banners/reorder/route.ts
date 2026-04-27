import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { from, to } = await req.json()

  const { data } = await supabase
    .from('home_banners')
    .select('id, sort_order')
    .in('id', [from, to])

  if (!data || data.length !== 2) return NextResponse.json({})

  await supabase
    .from('home_banners')
    .update({ sort_order: data[1].sort_order })
    .eq('id', data[0].id)

  await supabase
    .from('home_banners')
    .update({ sort_order: data[0].sort_order })
    .eq('id', data[1].id)

  return NextResponse.json({ success: true })
}
``
