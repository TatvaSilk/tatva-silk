// app/api/pincode/route.ts
import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// Use Node.js runtime (safe with supabase-js)
export const runtime = 'nodejs'

// --------------
// Lightweight fallback labels (you can delete later)
// --------------
const FALLBACK: Record<string, { label: string; state?: string; district?: string }> = {
  '396321': { label: 'Billimora, Navsari, Gujarat', district: 'Navsari', state: 'Gujarat' },
  '395003': { label: 'Surat, Gujarat', district: 'Surat', state: 'Gujarat' },
  '396445': { label: 'Navsari, Gujarat', district: 'Navsari', state: 'Gujarat' },
}

type ApiResult = {
  ok: boolean
  pin: string
  label: string
  source: 'supabase' | 'fallback' | 'synthetic'
  data?: any
  message?: string
}

/**
 * GET /api/pincode?pin=396321
 * Returns a label like "Billimora, Navsari, Gujarat" if known.
 * If you create a `pincodes` table in Supabase (see SQL below), this API will
 * automatically use it; otherwise it falls back to the small local map above.
 */
export async function GET(req: NextRequest) {
  const pin = new URL(req.url).searchParams.get('pin')?.trim() ?? ''
  if (!/^\d{6}$/.test(pin)) {
    return Response.json<ApiResult>(
      { ok: false, pin, label: '', source: 'synthetic', message: 'Invalid PIN (expect 6 digits)' },
      { status: 400 }
    )
  }

  // Try Supabase table first (if you created it)
  try {
    // We expect a table like: public.pincodes(pin text, office_name text, district text, state text, delivery boolean)
    const { data, error } = await supabase
      .from('pincodes')
      .select('pin, office_name, district, state, delivery')
      .eq('pin', pin)
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      const parts = [
        data.office_name?.trim(),
        data.district?.trim(),
        data.state?.trim(),
      ].filter(Boolean)
      const label = parts.length ? parts.join(', ') : `PIN ${pin}`
      return new Response(
        JSON.stringify({ ok: true, pin, label, source: 'supabase', data } satisfies ApiResult),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            // Cache for 1 day at the CDN; disable stale if you plan frequent updates.
            'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400',
          },
        }
      )
    }
  } catch {
    // ignore and fall back
  }

  // Fallback label (small local map)
  const fallback = FALLBACK[pin]
  if (fallback) {
    return Response.json<ApiResult>(
      { ok: true, pin, label: fallback.label, source: 'fallback', data: fallback },
      {
        status: 200,
        headers: { 'cache-control': 'public, s-maxage=86400, stale-while-revalidate=86400' },
      }
    )
  }

  // If unknown, return a generic but valid label (so UI still works)
  return Response.json<ApiResult>(
    { ok: true, pin, label: `PIN ${pin}`, source: 'synthetic' },
    {
      status: 200,
      headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=300' },
    }
  )
}
