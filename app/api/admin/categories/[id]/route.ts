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

function assertAdmin(me: { role: string; approved: boolean } | null) {
  if (!me || me.approved !== true) return false;
  return ['admin', 'manager'].includes(me.role as any);
}

// PATCH /api/admin/categories/[id]
// Body: { label?, slug?, parent_id? }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { data: me } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single();
  if (!assertAdmin(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const patch: any = {};
  if (typeof body.label === 'string') patch.label = body.label.trim();
  if (typeof body.slug === 'string') patch.slug = body.slug.trim().toLowerCase().replace(/\s+/g, '-');
  if (body.parent_id !== undefined) patch.parent_id = body.parent_id ?? null;

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('categories')
    .update(patch)
    .eq('id', params.id)
    .select('id, label, slug, parent_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/admin/categories/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { data: me } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single();
  if (!assertAdmin(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const id = params.id;
  const admin = supabaseAdmin();

  // Block delete if category has children
  const { data: kids } = await admin.from('categories').select('id').eq('parent_id', id).limit(1);
  if ((kids ?? []).length) {
    return NextResponse.json({ error: 'has-children' }, { status: 400 });
  }

  // Block delete if products reference this category
  const { data: prods } = await admin.from('products').select('id').eq('category_id', id).limit(1);
  if ((prods ?? []).length) {
    return NextResponse.json({ error: 'has-products' }, { status: 400 });
  }

  const { error } = await admin.from('categories').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
