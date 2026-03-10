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

  const { data: products, error: pErr } = await admin
    .from('products')
    .select('id, name, original_price, offer_price, stock, category_id, created_at')
    .order('created_at', { ascending: false });
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!products?.length) return NextResponse.json([]);

  const ids = products.map(p => p.id);
  const { data: imgs, error: iErr } = await admin
    .from('product_images')
    .select('product_id, url, sort_order')
    .in('product_id', ids)
    .order('sort_order', { ascending: true });
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  const firstMap = new Map<string, string|null>();
  for (const id of ids) firstMap.set(id, null);
  for (const row of imgs ?? []) {
    const pid = row.product_id as string;
    if (!firstMap.get(pid)) firstMap.set(pid, row.url as string);
  }

  const catIds = Array.from(new Set(products.map(p => p.category_id).filter(Boolean))) as string[];
  const labels = new Map<string,string>();
  if (catIds.length) {
    const { data: cats, error: cErr } = await admin
      .from('categories')
      .select('id,label')
      .in('id', catIds);
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
    for (const c of cats ?? []) labels.set(c.id, c.label);
  }

  const result = products.map(p => ({
    ...p,
    category_label: p.category_id ? (labels.get(p.category_id) ?? null) : null,
    primary_image_url: firstMap.get(p.id) ?? null
  }));

  return NextResponse.json(result);
}

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
    offer_price: body.offer_price == null || body.offer_price === '' ? null : Number(body.offer_price),
    stock: Number(body.stock ?? 0),
    category_id: body.category_id ?? null
  };
  const imageUrl: string | null = body.image_url ? String(body.image_url) : null;

  if (!payload.name) return NextResponse.json({ error: 'name-required' }, { status: 400 });
  if (Number.isNaN(payload.original_price) || payload.original_price < 0) return NextResponse.json({ error: 'invalid-original-price' }, { status: 400 });
  if (payload.offer_price !== null && (Number.isNaN(payload.offer_price) || payload.offer_price < 0)) return NextResponse.json({ error: 'invalid-offer-price' }, { status: 400 });
  if (!Number.isInteger(payload.stock) || payload.stock < 0) return NextResponse.json({ error: 'invalid-stock' }, { status: 400 });

  const admin = supabaseAdmin();
  const { data: created, error: cErr } = await admin
    .from('products')
    .insert(payload)
    .select('id, name, original_price, offer_price, stock, category_id, created_at')
    .single();
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

  if (imageUrl) {
    const { error: iErr } = await admin
      .from('product_images')
      .insert({ product_id: created.id, url: imageUrl, alt: created.name, sort_order: 1 });
    if (iErr) return NextResponse.json({ ...created, primary_image_url: null, warning: 'image-insert-failed' }, { status: 201 });
  }

  return NextResponse.json({ ...created, primary_image_url: imageUrl ?? null }, { status: 201 });
}
