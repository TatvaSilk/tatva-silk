// app/api/store/categories/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';      // never pre-render
export const revalidate = 0;                 // no ISR
export const fetchCache = 'force-no-store';  // skip Next fetch cache

type Cat = { id: string; label: string | null; slug: string | null; parent_id?: string | null };

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
    'Content-Type': 'application/json',
  };
}

export async function GET() {
  const headers = noStoreHeaders();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    const missing = [
      !url ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !serviceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ]
      .filter(Boolean)
      .join(', ');
    return NextResponse.json(
      { error: `Missing environment variable(s): ${missing}` },
      { status: 500, headers }
    );
  }

  // Server-only client with service role (RLS-safe on server)
  const supabase = createClient(url, serviceKey);

  // 1) Parents (top level)
  const { data: parents, error: pErr } = await supabase
    .from('categories')
    .select('id, label, slug')
    .is('parent_id', null)
    .order('label', { ascending: true });

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500, headers });
  }

  const parentRows: Cat[] = (parents ?? []).map((p) => ({
    id: p.id,
    label: p.label,
    slug: (p.slug ?? p.label ?? '').toString().toLowerCase(),
    parent_id: null,
  }));

  if (parentRows.length === 0) {
    return NextResponse.json([], { status: 200, headers });
  }

  // 2) Children under those parents
  const parentIds = parentRows.map((p) => p.id);

  const { data: children, error: cErr } = await supabase
    .from('categories')
    .select('id, label, slug, parent_id')
    .in('parent_id', parentIds)
    .order('label', { ascending: true });

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500, headers });
  }

  const childRows: Cat[] = (children ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    slug: (c.slug ?? c.label ?? '').toString().toLowerCase(),
    parent_id: c.parent_id ?? null,
  }));

  // 3) Group children under each parent id
  const grouped = new Map<string, Cat[]>();
  parentRows.forEach((p) => grouped.set(p.id, []));
  childRows.forEach((c) => {
    if (!c.parent_id) return;
    const list = grouped.get(c.parent_id) ?? [];
    list.push(c);
    grouped.set(c.parent_id, list);
  });

  // 4) Shape payload
  const payload = parentRows.map((p) => ({
    id: p.id,
    label: p.label ?? '',
    slug: p.slug ?? '',
    parent_id: null, // <— plain null (no `as const`)
    children: (grouped.get(p.id) ?? []).map((c) => ({
      id: c.id,
      label: c.label ?? '',
      slug: c.slug ?? '',
      parent_id: c.parent_id,
    })),
  }));

  return NextResponse.json(payload, { status: 200, headers });
}
