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

function assertAdmin(me: { role: string; approved: boolean } | null) {
  if (!me || me.approved !== true) return false;
  return ['admin', 'manager'].includes(me.role as any);
}

// GET /api/admin/categories
// Query: ?tree=1 (return nested), ?parent_id=... (children only)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tree = url.searchParams.get('tree') === '1';
  const parentId = url.searchParams.get('parent_id');

  const admin = supabaseAdmin();
  // flat list
  const { data, error } = await admin
    .from('categories')
    .select('id, slug, label, parent_id')
    .order('label', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parentId) {
    const children = (data ?? []).filter(c => (c.parent_id ?? null) === parentId);
    return NextResponse.json(children);
  }

  if (!tree) {
    return NextResponse.json(data ?? []);
  }

  // build tree
  const byParent = new Map<string|null, any[]>();
  for (const c of data ?? []) {
    const key = (c.parent_id ?? null) as any;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push({ ...c, children: [] as any[] });
  }
  const roots = byParent.get(null) ?? [];
  const fill = (nodes: any[]) => {
    for (const n of nodes) {
      const kids = byParent.get(n.id) ?? [];
      n.children = kids;
      fill(kids);
    }
  };
  fill(roots);
  return NextResponse.json(roots);
}

// POST /api/admin/categories
// Body: { label: string, slug?: string, parent_id?: string|null }
export async function POST(req: NextRequest) {
  // auth
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : undefined;

  const supabase = clientFromToken(token);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  const { data: me } = await supabase.from('profiles').select('role, approved').eq('id', user.id).single();
  if (!assertAdmin(me)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const label = String(body.label ?? '').trim();
  let slug = String(body.slug ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const parent_id = body.parent_id ?? null;

  if (!label) return NextResponse.json({ error: 'label-required' }, { status: 400 });
  if (!slug) slug = label.toLowerCase().replace(/\s+/g, '-');

  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('categories')
    .insert({ label, slug, parent_id })
    .select('id, label, slug, parent_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
