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
function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Robust resolver: exact slug → label contains → child contains → fuzzy (≤2) */
async function resolveCategoryFilter(q?: string): Promise<
  | { childSlug: string }
  | { childIds: string[] }
  | null
> {
  if (!q) return null;
  const needleRaw = (q ?? '').trim().toLowerCase();
  const needle = norm(needleRaw);

  // 1) exact slug
  {
    const { data } = await supabase
      .from('categories')
      .select('id, slug, label, parent_id')
      .eq('slug', needle)
      .maybeSingle();
    if (data?.id) {
      if (data.parent_id) return { childSlug: norm(data.slug) };
      const { data: kids } = await supabase.from('categories').select('id').eq('parent_id', data.id);
      return { childIds: (kids ?? []).map(k => k.id) };
    }
  }

  // 2) label contains
  {
    const { data } = await supabase
      .from('categories')
      .select('id, slug, label, parent_id')
      .ilike('label', `%${needleRaw}%`)
      .maybeSingle();
    if (data?.id) {
      if (data.parent_id) return { childSlug: norm(data.slug) };
      const { data: kids } = await supabase.from('categories').select('id').eq('parent_id', data.id);
      return { childIds: (kids ?? []).map(k => k.id) };
    }
  }

  // 3) child contains (slug/label)
  {
    const { data: childHits } = await supabase
      .from('categories')
      .select('id, slug, label, parent_id')
      .or(`slug.ilike.%${needle}%,label.ilike.%${needleRaw}%`)
      .not('parent_id', 'is', null);
    if (childHits?.length) {
      if (childHits.length === 1) return { childSlug: norm(childHits[0].slug) };
      return { childIds: childHits.map(c => c.id) };
    }
  }

  // 4) fuzzy (≤2)
  {
    const { data: all } = await supabase.from('categories').select('id, slug, label, parent_id');
    const rows = (all ?? []).map(r => ({ ...r, nSlug: norm(r.slug), nLabel: norm(r.label) }));

    let bestChild: any = null, bestChildScore = 1e9;
    for (const r of rows) {
      if (!r.parent_id) continue;
      const s = Math.min(levenshtein(r.nSlug, needle), levenshtein(r.nLabel, needle));
      if (s < bestChildScore) bestChildScore = s, bestChild = r;
    }
    if (bestChild && bestChildScore <= 2) return { childSlug: bestChild.nSlug };

    let bestParent: any = null, bestParentScore = 1e9;
    for (const r of rows) {
      if (r.parent_id) continue;
      const s = Math.min(levenshtein(r.nSlug, needle), levenshtein(r.nLabel, needle));
      if (s < bestParentScore) bestParentScore = s, bestParent = r;
    }
    if (bestParent && bestParentScore <= 2) {
      const { data: kids } = await supabase.from('categories').select('id').eq('parent_id', bestParent.id);
      return { childIds: (kids ?? []).map(k => k.id) };
    }
  }

  return null;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const qp = (Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category) as string | undefined;

  const filter = await resolveCategoryFilter(qp);
  const debug = process.env.NEXT_PUBLIC_DEBUG_FILTER === 'true';
  const debugInfo =
    filter && 'childSlug' in filter
      ? `childSlug=${filter.childSlug}`
      : filter && 'childIds' in filter
      ? `childIds=[${filter.childIds.join(', ')}]`
      : qp
      ? `unresolved="${qp}"`
      : 'no category param';

  // If user passed a category we cannot resolve → show empty (not all)
  if (qp && !filter) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <Header qp={qp} />
        {debug && <Debug info={debugInfo} />}
        <p style={{ color: '#666' }}>No products found in “{qp}”.</p>
      </main>
    );
  }

  // Base query: also select the text fallbacks (category/subcategory)
  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      original_price,
      offer_price,
      stock,
      is_active,
      category_id,
      category,
      subcategory,
      categories:category_id ( slug, label ),
      product_images ( url, alt, sort_order )
    `
    )
    .eq('is_active', true);

  if (filter && 'childSlug' in filter) {
    query = supabase
      .from('products')
      .select(
        `
        id,
        name,
        original_price,
        offer_price,
        stock,
        is_active,
        category_id,
        category,
        subcategory,
        categories:category_id!inner ( slug, label ),
        product_images ( url, alt, sort_order )
      `
      )
      .eq('is_active', true)
      .eq('categories.slug', filter.childSlug);
  } else if (filter && 'childIds' in filter) {
    const ids = filter.childIds;
    if (ids?.length) query = query.in('category_id', ids);
    else query = query.eq('id', '___none___');
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <Header qp={qp} />
        {debug && <Debug info={debugInfo} />}
        <p style={{ color: 'crimson' }}>Failed to load products: {error.message}</p>
      </main>
    );
  }

  const rows: any[] = data ?? [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <Header qp={qp} />
      {debug && <Debug info={debugInfo} />}

      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>
          {qp ? `No products found in “${qp}”.` : 'No products found.'}
        </p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {rows.map((r) => {
            // Prefer relation → fallback to text columns we just synced
            const rel = Array.isArray(r.categories) ? (r.categories[0] ?? null) : (r.categories ?? null);
            const childLabel = rel?.label ?? (r.subcategory ? String(r.subcategory) : null);
            const childSlug  = (rel?.slug ?? r.subcategory ?? '')?.toLowerCase() || '';
            const parentLabel = r.category ? String(r.category).replace(/-/g, ' ') : null; // presentational

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
                  ) : '(no sub‑category)'}
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

/* ---------- Small helpers for header + debug ---------- */
function Header({ qp }: { qp?: string }) {
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
      ) : null}
    </div>
  );
}
function Debug({ info }: { info: string }) {
  return (
    <div style={{ background: '#fff7ed', color: '#9a3412', padding: 8, borderRadius: 6, marginBottom: 12 }}>
      DEBUG: {info}
    </div>
  );
}
