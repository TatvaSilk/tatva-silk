// app/api/store/categories/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'          // never pre-render
export const revalidate = 0                     // no ISR caching
export const fetchCache = 'force-no-store'      // disable fetch cache for this route

export async function GET() {
  // Defensive: ensure no HTTP caching by proxies/browsers
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  }

  // 1) Fetch PARENTS
  const { data: parentsData, error: pErr } = await supabase
    .from('categories')
    .select('id, label, slug')
    .is('parent_id', null)
    .order('label', { ascending: true })

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 500, headers })
  }
  const parents = parentsData ?? []
  const parentIds = parents.map(p => p.id)

  // If no parents, return empty list quickly
  if (!parentIds.length) {
    return new NextResponse(JSON.stringify([]), { headers })
  }

  // 2) Fetch CHILDREN for the parents
  const { data: childrenData, error: cErr } = await supabase
    .from('categories')
    .select('id, label, slug, parent_id')
    .in('parent_id', parentIds)
    .order('label', { ascending: true })

  if (cErr) {
    return NextResponse.json({ error: cErr.message }, { status: 500, headers })
  }

  // 3) Group children under their parent
  const grouped = new Map<string, any[]>()
  for (const p of parents) grouped.set(p.id, [])
  for (const c of (childrenData ?? [])) {
    const bucket = grouped.get(c.parent_id) ?? []
    bucket.push({
      id: c.id,
      label: c.label,
      slug: (c.slug ?? '').toLowerCase(),
      parent_id: c.parent_id
    })
    grouped.set(c.parent_id, bucket)
  }

  // 4) Build payload
  const payload = parents.map(p => ({
    id: p.id,
    label: p.label,
    slug: (p.slug ?? '').toLowerCase(),
    parent_id: null,
    children: grouped.get(p.id) ?? []
  }))

  return new NextResponse(JSON.stringify(payload), { headers })
}
