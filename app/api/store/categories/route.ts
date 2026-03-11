// app/api/store/categories/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Ensure this endpoint is NEVER cached
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET() {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json',
  }

  // 1) Parents
  const { data: parentsData, error: pErr } = await supabase
    .from('categories')
    .select('id, label, slug')
    .is('parent_id', null)
    .order('label', { ascending: true })

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500, headers })
  }

  const parents = parentsData ?? []
  if (!parents.length) {
    return new NextResponse(JSON.stringify([]), { headers })
  }

  const parentIds = parents.map(p => p.id)

  // 2) Children
  const { data: childrenData, error: cErr } = await supabase
    .from('categories')
    .select('id, label, slug, parent_id')
    .in('parent_id', parentIds)
    .order('label', { ascending: true })

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500, headers })
  }

  // 3) Group children
  const grouped = new Map<string, any[]>()
  for (const p of parents) grouped.set(p.id, [])
  for (const c of (childrenData ?? [])) {
    grouped.get(c.parent_id)?.push({
      id: c.id,
      label: c.label,
      slug: (c.slug ?? '').toLowerCase(),
      parent_id: c.parent_id,
    })
  }

  // 4) Shape
  const payload = parents.map(p => ({
    id: p.id,
    label: p.label,
    slug: (p.slug ?? '').toLowerCase(),
    parent_id: null,
    children: grouped.get(p.id) ?? [],
  }))

  return new NextResponse(JSON.stringify(payload), { headers })
}
