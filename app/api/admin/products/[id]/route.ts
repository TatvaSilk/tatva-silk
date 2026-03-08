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
  return { ok: true as const, supabase };
}

// GET /api/admin/products/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('products')
    .select('id, name, price, stock, category, image, description, created_at')
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/admin/products/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const body = await req.json();
  const patch: any = {};
  if (typeof body.name === 'string') patch.name = body.name.trim();
  if (typeof body.description === 'string') patch.description = body.description;
  if (body.price !== undefined) patch.price = Number(body.price);
  if (body.stock !== undefined) patch.stock = Number(body.stock);
  if (typeof body.category === 'string' || body.category === null) patch.category = body.category ?? null;
  if (typeof body.image === 'string' || body.image === null) patch.image = body.image ?? null;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('products')
    .update(patch)
    .eq('id', params.id)
    .select('id, name, price, stock, category, image, description, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await authAndRole(req);
  if (!auth.ok) return NextResponse.json({ error: 'unauthorized' }, { status: auth.code });

  const admin = supabaseAdmin();
  const { error } = await admin.from('products').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
