export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function clientFromToken(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// GET /api/admin/products  → list
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, approved')
    .eq('id', user.id)
    .single();

  if (!me || me.approved !== true || !['admin','manager'].includes(me.role as any)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('products')
    .select('id, name, original_price, offer_price, stock, category, image, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/admin/products  → create
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me } = await supabase
    .from('profiles')
    .select('role, approved')
    .eq('id', user.id)
    .single();

  if (!me || me.approved !== true || !['admin','manager'].includes(me.role as any)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const payload: any = {
    name: String(body.name ?? '').trim(),
    description: body.description ? String(body.description) : null,
    original_price: Number(body.original_price ?? 0),
    offer_price: body.offer_price === null || body.offer_price === undefined
      ? null
      : Number(body.offer_price),
    stock: Number(body.stock ?? 0),
    category: body.category ? String(body.category) : null,
    image: body.image ? String(body.image) : null
  };

  if (!payload.name) return NextResponse.json({ error: 'name-required' }, { status: 400 });
  if (Number.isNaN(payload.original_price) || payload.original_price < 0) {
    return NextResponse.json({ error: 'invalid-original-price' }, { status: 400 });
  }
  if (payload.offer_price !== null && (Number.isNaN(payload.offer_price) || payload.offer_price < 0)) {
    return NextResponse.json({ error: 'invalid-offer-price' }, { status: 400 });
  }
  if (!Number.isInteger(payload.stock) || payload.stock < 0) {
    return NextResponse.json({ error: 'invalid-stock' }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('products')
    .insert(payload)
    .select('id, name, original_price, offer_price, stock, category, image, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
