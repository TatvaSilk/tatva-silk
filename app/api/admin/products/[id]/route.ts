export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

function clientFromToken(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function authAndRole(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7) : undefined;
  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, code: 401, supabase };
  const { data: me } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single();
  if (!me || me.approved !== true || !['admin','manager'].includes(me.role as any)) {
    return { ok: false as const, code: 403, supabase };
  }
  return { ok: true as const };
}

// GET one
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const admin = supabaseAdmin();
  const { data: p, error: pErr } = await admin
    .from('products')
    .select('id, name, description, original_price, offer_price, stock, category_id, created_at')
    .eq('id', params.id).single();
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
  if (!p) return NextResponse.json({ error: 'not-found' }, { status: 404 });

  const { data: img, error: iErr } = await admin
    .from('product_images')
    .select('url, alt, sort_order')
    .eq('product_id', params.id)
    .order('sort_order', { ascending: true })
    .limit(1).maybeSingle();
  if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

  return NextResponse.json({ ...p, primary_image_url: img?.url ?? null, primary_image_alt: img?.alt ?? null });
}

// PATCH one
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const body = await req.json();
  const patch: any = {};
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (typeof body.description === 'string' || body.description === null) patch.description = body.description ?? null;
  if (body.original_price !== undefined) patch.original_price = Number(body.original_price);
  if (body.offer_price !== undefined) patch.offer_price = body.offer_price == null ? null : Number(body.offer_price);
  if (body.stock !== undefined) patch.stock = Number(body.stock);
  if (body.category_id !== undefined) patch.category_id = body.category_id;

  const imageUrl: string | null | undefined = body.image_url;

  const admin = supabaseAdmin();
  if (Object.keys(patch).length > 0) {
    const { error: uErr } = await admin.from('products').update(patch).eq('id', params.id);
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
  }

  // Upsert primary image at sort_order=1
  if (imageUrl !== undefined) {
    const { data: existing } = await admin
      .from('product_images')
      .select('id, sort_order')
      .eq('product_id', params.id)
      .order('sort_order', { ascending: true })
      .limit(1).maybeSingle();

    if (imageUrl === null || imageUrl === '') {
      if (existing) {
        const { error: delErr } = await admin.from('product_images').delete().eq('id', existing.id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
      }
    } else {
      if (existing) {
        const { error: updErr } = await admin
          .from('product_images')
          .update({ url: imageUrl, sort_order: 1 })
          .eq('id', existing.id);
        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
      } else {
        const { error: insErr } = await admin
          .from('product_images')
          .insert({ product_id: params.id, url: imageUrl, sort_order: 1 });
        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }
  }

  // Return fresh snapshot
  const { data: p2 } = await admin
    .from('products')
    .select('id, name, description, original_price, offer_price, stock, category_id, created_at')
    .eq('id', params.id).single();
  const { data: img } = await admin
    .from('product_images')
    .select('url, alt, sort_order')
    .eq('product_id', params.id)
    .order('sort_order', { ascending: true })
    .limit(1).maybeSingle();

  return NextResponse.json({ ...(p2 ?? {}), primary_image_url: img?.url ?? null });
}

// DELETE one
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const admin = supabaseAdmin();
  await admin.from('product_images').delete().eq('product_id', params.id);
  const { error } = await admin.from('products').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
