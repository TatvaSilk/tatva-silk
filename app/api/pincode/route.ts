// app/api/pincode/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

export async function GET(req: NextRequest) {
  const pin = new URL(req.url).searchParams.get('pin')?.trim() ?? ''
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json(
      { ok: false, pin, label: '', source: 'synthetic', message: 'Invalid PIN (expect 6 digits)' } as ApiResult,
      { status: 400 }
    )
  }

  // 1) memory cache
  const memo = MEMO.get(pin)
  if (memo) {
    return NextResponse.json(
      { ok: true, pin, label: memo, source: 'mem' } as ApiResult,
      { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    )
  }

  // 2) DB lookup
  try {
    const { data, error } = await supabase
      .from('pincodes')
      .select('district,state')
      .eq('pin', pin)
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      const parts = [data.district?.trim(), data.state?.trim()].filter(Boolean)
      const label = parts.length ? parts.join(', ') : `PIN ${pin}`
      MEMO.set(pin, label)
      return NextResponse.json(
        { ok: true, pin, label, source: 'supabase' } as ApiResult,
        { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
      )
    }
  } catch {
    // ignore and fallback
  }

  // 3) fallback
  const fb = FALLBACK[pin]
  if (fb) {
    MEMO.set(pin, fb)
    return NextResponse.json(
      { ok: true, pin, label: fb, source: 'fallback' } as ApiResult,
      { status: 200, headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' } }
    )
  }

  // 4) unknown but valid: still return a label to keep UX smooth
  const synthetic = `PIN ${pin}`
  MEMO.set(pin, synthetic)
  return NextResponse.json(
    { ok: true, pin, label: synthetic, source: 'synthetic' } as ApiResult,
    { status: 200, headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=300' } }
  )
}
