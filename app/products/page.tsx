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

/** Resolve ?category= to:
 *  - { childSlug } when it’s a child (e.g., "kanjivam")
 *  - { childIds } when it’s a parent (e.g., "sarees") — list of all child IDs
 *  - null        when nothing matches (we will show ZERO items)
 */
async function resolveCategoryFilter(q?: string): Promise<
  | { childSlug: string }
  | { childIds: string[] }
  | null
> {
  if (!q) return null;
  const needle = q.trim().toLowerCase();

  // 1) exact slug
  const { data: bySlug } = await supabase
    .from('categories')
    .select('id, slug, parent_id')
    .eq('slug', needle)
    .maybeSingle();

  if (bySlug?.slug) {
    if (bySlug.parent_id) {
      // child
      return { childSlug: bySlug.slug };
    } else {
      // parent → collect children
      const { data: kids } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', bySlug.id);
      const childIds = (kids ?? []).map(k => k.id);
      return { childIds };
    }
  }

  // 2) label contains (handles "Kanjivaram" vs "Kanjivam", case-insensitive)
  const { data: byLabel } = await supabase
    .from('categories')
    .select('id, slug, parent_id')
    .ilike('label', `%${needle}%`)
    .maybeSingle();

  if (byLabel?.slug) {
    if (byLabel.parent_id) {
      return { childSlug: byLabel.slug };
    } else {
      const { data: kids } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', byLabel.id);
      const childIds = (kids ?? []).map(k => k.id);
      return { childIds };
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

  // Optional debug banner — set NEXT_PUBLIC_DEBUG_FILTER=true in Vercel to show it
  const debug = process.env.NEXT_PUBLIC_DEBUG_FILTER === 'true';
  const debugInfo =
    filter && 'childSlug' in filter
      ? `childSlug=${filter.childSlug}`
      : filter && 'childIds' in filter
      ? `childIds=[${filter.childIds.join(', ')}]`
      : qp
      ? `unresolved param="${qp}"`
      : 'no category param';

  // If a category param was provided but we couldn’t resolve it,
  // return ZERO items (don’t show everything).
  if (qp && !filter) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Products</h1>
          <div style={{ fontSize: 14, color: '#555' }}>
            <span>Filtered by: </span>
            <strong style={{ textTransform: 'capitalize' }}>{qp}</strong>
            <span style={{ margin: '0 8px' }}>|</span>
            <Link href="/products">Clear filter</Link>
          </div>
        </div>

        {debug ? (
          <div style={{ background: '#fff7ed', color: '#9a3412', padding: 8, borderRadius: 6, marginBottom: 12 }}>
            DEBUG: {debugInfo}
          </div>
        ) : null}

        <p style={{ color: '#666' }}>
          No products found in “{qp}”.
        </p>
      </main>
    );
  }

  // Build the base query
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
      categories:category_id ( slug, label ),
      product_images ( url, alt, sort_order )
    `
    )
    .eq('is_active', true);

  // Apply filter
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
        categories:category_id!inner ( slug, label ),
        product_images ( url, alt, sort_order )
      `
      )
      .eq('is_active', true)
      .eq('categories.slug', filter.childSlug);
  } else if (filter && 'childIds' in filter) {
    const ids = filter.childIds;
    if (ids.length === 0) {
      // parent with no children → empty
      query = query.eq('id', '___no_such_id___');
    } else {
      query = query.in('category_id', ids);
    }
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <h1>Products</h1>
        {debug ? (
          <div style={{ background: '#fff7ed', color: '#9a3412', padding: 8, borderRadius: 6, margin: '8px 0' }}>
            DEBUG: {debugInfo}
          </div>
        ) : null}
        <p style={{ color: 'crimson' }}>Failed to load products: {error.message}</p>
      </main>
    );
  }

  const rows: any[] = data ?? [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
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

      {debug ? (
        <div style={{ background: '#fff7ed', color: '#9a3412', padding: 8, borderRadius: 6, marginBottom: 12 }}>
          DEBUG: {debugInfo}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>
          {qp ? `No products found in “${qp}”.` : 'No products found.'}
        </p>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {rows.map((r) => {
            const rel = Array.isArray(r.categories) ? (r.categories[0] ?? null) : (r.categories ?? null);
            const label: string | null = rel?.label ?? null;
            const slug: string = (rel?.slug ?? '')?.toLowerCase() || '';
            const firstImage = pickFirstImage((r.product_images ?? []) as ProductImage[]);
            const effectivePrice =
              typeof r.offer_price === 'number' ? r.offer_price : (r.original_price as number | null);

            return (
              <article key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {firstImage ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 180,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
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

                {label ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                    <Link href={`/products?category=${encodeURIComponent(slug)}`} className="hover:underline">
                      {label.toLowerCase()}
                    </Link>
                  </div>
                ) : (
                  <div style={{ color: '#999', fontSize: 12, marginBottom: 6 }}>(no sub‑category)</div>
                )}

                <div style={{ fontWeight: 600 }}>{formatInr(effectivePrice)}</div>

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
