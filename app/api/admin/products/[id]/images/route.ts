export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../../../../lib/supabaseAdmin';

function clientFromToken(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

type Body = { urls: string[] };

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;
  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: me } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single();
  if (!me || me.approved !== true || !['admin','manager'].includes(me.role as any)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const productId = params.id;
  const body = (await req.json()) as Body;
  const urls = (body.urls ?? []).filter(Boolean);
  if (!productId || urls.length === 0) return NextResponse.json({ error: 'no-images' }, { status: 400 });

  const admin = supabaseAdmin();

  const { data: existing } = await admin
    .from('product_images')
    .select('sort_order')
    .eq('product_id', productId)
    .order('sort_order', { ascending: false })
    .limit(1);

  let startOrder = existing?.[0]?.sort_order ?? 0;
  const rows = urls.map((u, i) => ({ product_id: productId, url: u, sort_order: startOrder + i + 1 }));

  const { error: insErr } = await admin.from('product_images').insert(rows);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, count: rows.length });
}
``
