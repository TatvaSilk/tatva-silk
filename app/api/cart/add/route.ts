// app/api/cart/add/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // or 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // TODO: later we’ll store in a cookie or Supabase cart table
    return NextResponse.json({ ok: true, received: body })
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request' }, { status: 400 })
  }
}
``
