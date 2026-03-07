// app/api/pincode/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// In-process micro-cache (pin -> label). Resets on cold start/redeploy.
const MEMO = new Map<string, string>()

// Small fallback while you build out the table (optional)
const FALLBACK: Record<string, string> = {
  '396321': 'Billimora, Navsari, Gujarat',
  '395003': 'Surat, Gujarat',
  '396445': 'Navsari, Gujarat',
}

type ApiResult = {
  ok: boolean
  pin: string
  label: string
  source: 'mem' | 'supabase' | 'fallback' | 'synthetic'
  message?: string
}

function json(data: ApiResult, init?: number | ResponseInit) {
  const defaultHeaders = {
    'content-type': 'application/json; charset=utf-8',
  }
  if (typeof init === 'number') {
    return NextResponse.json(data, { status: init, headers: defaultHeaders })
  }
  return NextResponse.json(data, {
    ...(init as ResponseInit),
    headers: { ...defaultHeaders, ...(init as ResponseInit)?.headers },
  })
}

export async function GET(req: NextRequest) {
  const pin = new URL(req.url).searchParams.get('pin')?.trim() ?? ''

  // 0) basic validation
  if (!/^\d{6}$/.test(pin)) {
    return json(
      { ok: false, pin, label: '', source: 'synthetic', message: 'Invalid PIN (expect 6 digits)' },
      400
    )
  }

  // 1) memory cache
  const memo = MEMO.get(pin)
  if (memo) {
    return json(
      { ok: true, pin, label: memo, source: 'mem' },
      { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    )
  }

  // 2) DB lookup
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(url, anon, { auth: { persistSession: false } })

    // Table: pincodes(district text, state text, pin text primary key)
    const { data, error } = await supabase
      .from('pincodes')
      .select('district, state')
      .eq('pin', pin)
      .maybeSingle()

    if (error) {
      // Likely an RLS/policy issue or table missing; return 500 for observability
      return json(
        { ok: false, pin, label: '', source: 'synthetic', message: 'Lookup failed' },
        { status: 500, headers: { 'cache-control': 'no-store' } }
      )
    }

    if (data) {
      const parts = [data.district?.trim(), data.state?.trim()].filter(Boolean)
      const label = parts.length ? parts.join(', ') : `PIN ${pin}`
      MEMO.set(pin, label)
      return json(
        { ok: true, pin, label, source: 'supabase' },
        { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
      )
    }
  } catch {
    // fallthrough to fallback/synthetic
  }

  // 3) fallback
  const fb = FALLBACK[pin]
  if (fb) {
    MEMO.set(pin, fb)
    return json(
      { ok: true, pin, label: fb, source: 'fallback' },
      { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    )
  }

  // 4) unknown but valid: still return a label to keep UX smooth
  const synthetic = `PIN ${pin}`
  MEMO.set(pin, synthetic)
  return json(
    { ok: true, pin, label: synthetic, source: 'synthetic' },
    { status: 200, headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=300' } }
  )
}
