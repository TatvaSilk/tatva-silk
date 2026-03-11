// app/products/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null };

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}
function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u);
}
function pickFirstImage(images: ProductImage[] = []) {
  const imgs = (images ?? [])
    .filter((img) => isValidHttpUrl(img.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  return imgs[0] ?? null;
}
function norm(s?: string | null) {
  return (s ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/_+/g, '-');
}

/**
 * Deterministic resolver → list of CHILD category IDs from a term:
 * 1) exact child slug
 * 2) exact parent slug → all children
 * 3) child label contains
 * 4) parent label contains → all children
 */
async function resolveChildIds(term?: string): Promise<string[]> {
  if (!term) return [];
  const raw = term.trim();
  const slug = norm(raw);

  // 1) exact child slug
  {
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .not('parent_id', 'is', null)
      .maybeSingle();
    if (data?.id) return [data.id];
  }

  // 2) exact parent slug → children
  {
    const { data: parent } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .is('parent_id', null)
      .maybeSingle();
    if (parent?.id) {
      const { data: kids } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', parent.id);
      return (kids ?? []).map((k) => k.id);
    }
  }

  // 3) child label contains
  {
    const { data: childHits } = await supabase
      .from('categories')
      .select('id')
      .not('parent_id', 'is', null)
      .ilike('label', `%${raw}%`);
    if (childHits?.length) return childHits.map((c) => c.id);
  }

  // 4) parent label contains → children
  {
    const { data: parentHit } = await supabase
      .from('categories')
      .select('id')
      .is('parent_id', null)
      .ilike('label', `%${raw}%`)
      .maybeSingle();
    if (parentHit?.id) {
      const { data: kids } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', parentHit.id);
      return (kids ?? []).map((k) => k.id);
    }
  }

  return [];
}

function intersect(a: string[], b: string[]) {
  if (!a.length || !b.length) return [];
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // URL params
  const qp = (Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category) as string | undefined;

  const qSearch = (Array.isArray(searchParams?.search)
    ? searchParams?.search[0]
    : searchParams?.search) as string | undefined;

  // Resolve IDs
  const idsFromCategory = await resolveChildIds(qp);       // parent or child
  const idsFromSearchAsCategory =
    !qp && qSearch ? await resolveChildIds(qSearch) : [];  // only when no category param

  // Decide which IDs to use (intersection logic)
  // Cases:
  // 1) category present, search resolves to category → INTERSECT
  // 2) category present, search is general text → use category IDs + text filter
  // 3) no category, search resolves to category → use those IDs
  // 4) no category, plain text search → no IDs (text only)
  let finalIds: string[] = [];

  if (qp) {
    if (!idsFromCategory.length) {
      // Category param present but could not resolve → early return
      return (
        <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
          <Header qp={qp} qSearch={qSearch} />
          <p style={{ color: '#666' }}>No products found in “{qp}”.</p>
        </main>
      );
    }

    // If user typed a search that itself resolves to category IDs, intersect
    const idsFromSearchWhenCategory = qSearch ? await resolveChildIds(qSearch) : [];
    finalIds = idsFromSearchWhenCategory.length
      ? intersect(idsFromCategory, idsFromSearchWhenCategory)
      : idsFromCategory;

    // If intersection is empty but user tried to sub‑select a child that
    // doesn't belong under the current parent, return empty quickly.
    if (idsFromSearchWhenCategory.length && finalIds.length === 0) {
      return (
        <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
          <Header qp={qp} qSearch={qSearch} />
          <p style={{ color: '#666' }}>No products found.</p>
        </main>
      );
    }
  } else if (idsFromSearchAsCategory.length) {
    // No category param; search itself is a category → use those IDs
    finalIds = idsFromSearchAsCategory;
  }

  // Build query
  const baseSelect = `
    id,
    name,
    description,
    original_price,
    offer_price,
    stock,
    is_active,
    category_id,
    category,
    subcategory,
    categories:category_id ( slug, label ),
    product_images ( url, alt, sort_order )
  `;

  let query = supabase
    .from('products')
    .select(baseSelect)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Apply ID filters when we have them
  if (finalIds.length) {
    query = query.in('category_id', finalIds);
  }

  // If we didn't resolve the search to category IDs, apply free‑text search
  if (qSearch && qSearch.trim() && !idsFromSearchAsCategory.length && !(qp && (await resolveChildIds(qSearch)).length)) {
    const term = `%${qSearch.trim()}%`;
    query = query.or(
      `name.ilike.${term},description.ilike.${term},category.ilike.${term},subcategory.ilike.${term}`
    );
  }

  const { data, error } = await query;

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <Header qp={qp} qSearch={qSearch} />
        <p style={{ color: 'crimson' }}>Failed to load products: {error.message}</p>
      </main>
    );
  }

  const rows: any[] = data ?? [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <Header qp={qp} qSearch={qSearch} />

      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>
          {qp
            ? `No products found in “${qp}”.`
            : qSearch
            ? `No products match “${qSearch}”.`
            : 'No products found.'}
        </p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {rows.map((r) => {
            const rel = Array.isArray(r.categories) ? (r.categories[0] ?? null) : (r.categories ?? null);
            const childLabel = rel?.label ?? (r.subcategory ? String(r.subcategory) : null);
            const childSlug  = (rel?.slug ?? r.subcategory ?? '')?.toLowerCase() || '';
            const parentLabel = r.category ? String(r.category).replace(/-/g, ' ') : null;

            const firstImage = pickFirstImage((r.product_images ?? []) as ProductImage[]);
            const price = typeof r.offer_price === 'number' ? r.offer_price : (r.original_price as number | null);

            return (
              <article key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {firstImage ? (
                  <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                    <Image
                      src={firstImage.url!}
                      alt={firstImage.alt ?? r.name ?? 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : null}

                <h3 style={{ margin: '8px 0 4px' }}>{r.name ?? 'Untitled'}</h3>

                <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                  {parentLabel ? parentLabel : '(no category)'}
                  {parentLabel && childLabel ? ' • ' : null}
                  {childLabel ? (
                    <Link href={`/products?category=${encodeURIComponent(childSlug)}`} className="hover:underline">
                      {String(childLabel).toLowerCase()}
                    </Link>
                  ) : (
                    '(no sub‑category)'
                  )}
                </div>

                <div style={{ fontWeight: 600 }}>{formatInr(price)}</div>

                <div style={{ marginTop: 10 }}>
                  <Link href={`/products/${r.id}`} style={{ color: '#2563eb' }}>
                    View details →
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

/* ---------- small helpers ---------- */
function Header({ qp, qSearch }: { qp?: string; qSearch?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <h1 style={{ margin: 0 }}>Products</h1>
      {qp ? (
        <div style={{ fontSize: 14, color: '#555' }}>
          <span>Filtered by: </span>
          <strong style={{ textTransform: 'capitalize' }}>{qp}</strong>
          <span style={{ margin: '0 8px' }}>|</span>
          <Link href="/products">Clear filter</Link>
        </div>
      ) : qSearch ? (
        <div style={{ fontSize: 14, color: '#555' }}>
          <span>Search results for: </span>
          <strong>{qSearch}</strong>
          <span style={{ margin: '0 8px' }}>|</span>
          <Link href="/products">Clear</Link>
        </div>
      ) : null}
    </div>
  );
}
