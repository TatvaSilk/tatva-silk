import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
    const supabase = createClient(url, key, { auth: { persistSession: false } })

    // A tiny query against a metadata or products table.
    // Replace with a table that definitely exists, e.g., products.
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'unknown' }, { status: 500 })
  }
}
