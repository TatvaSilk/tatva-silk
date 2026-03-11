// app/api/store/categories/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  // Create server supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!   // IMPORTANT !!!
  );

  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json',
  };

  // 1) Fetch PARENTS
  const { data: parents, error: pErr } = await supabase
    .from('categories')
    .select('id, label, slug')
    .is('parent_id', null)
    .order('label');

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500, headers });
  }

  if (!parents || parents.length === 0) {
    return NextResponse.json([], { status: 200, headers });
  }

  // 2) Fetch CHILDREN
  const parentIds = parents.map((p) => p.id);

  const { data: children, error: cErr } = await supabase
    .from('categories')
    .select('id, label, slug, parent_id')
    .in('parent_id', parentIds)
    .order('label');

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500, headers });
  }

  // 3) Group children under parents
  const grouped: Record<string, any[]> = {};
  parents.forEach((p) => (grouped[p.id] = []));

  (children ?? []).forEach((c) => {
    grouped[c.parent_id].push({
      id: c.id,
      label: c.label,
      slug: (c.slug ?? '').toLowerCase(),
      parent_id: c.parent_id,
    });
  });

  const payload = parents.map((p) => ({
    id: p.id,
    label: p.label,
    slug: (p.slug ?? '').toLowerCase(),
    parent_id: null,
    children: grouped[p.id] ?? [],
  }));

  return NextResponse.json(payload, { status: 200, headers });
}
