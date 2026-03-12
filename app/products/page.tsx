// app/products/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null };

function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u);
}
function pickFirstImage(images: ProductImage[] = []) {
  const imgs = (images ?? [])
    .filter((img) => isValidHttpUrl(img.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
  return imgs[0] ?? null;
}
function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  // Read ?category= from URL
  const qp = (Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category) as string | undefined;

  // Read ?search= from URL (kept working as you want)
  const qSearch = (Array.isArray(searchParams?.search)
    ? searchParams?.search[0]
    : searchParams?.search) as string | undefined;

  // ---------- STEP 1: strict CHILD slug only ----------
  let childId: string | null = null;
  if (qp && qp.trim()) {
    const slug = qp.trim().toLowerCase();
    const { data: child } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .not('parent_id', 'is', null) // child only
      .maybeSingle();

    childId = child?.id ?? null;
  }

  // If a category param was provided but we couldn't resolve a child id -> show empty (don't hit DB with fake UUIDs)
  if (qp && !childId) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <Header qp={qp} qSearch={qSearch} />
        <Debug info={`childId=(none) for slug="${qp}" (child-only step)`} />
        <p style={{ color: '#666' }}>No products found in “{qp}”.</p>
      </main>
    );
  }

  // Build query
  const selectCols = `
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
    .select(selectCols)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Apply strict child filter if present
  if (childId) {
    query = query.eq('category_id', childId);
  }

  // Apply free-text search (kept as you wanted)
  if (qSearch && qSearch.trim()) {
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
        <Debug info={`ERROR: ${error.message} | childId=${childId ?? '(none)'}`} />
        <p style={{ color: 'crimson' }}>Failed to load products: {error.message}</p>
      </main>
    );
  }

  const rows: any[] = data ?? [];

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <Header qp={qp} qSearch={qSearch} />
      <Debug info={`childId=${childId ?? '(none)'} (child-only step)`} />

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

                <div style={{ fontWeight: 600 }}>
                  {formatInr(price)}
                </div>

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

/* --- tiny helpers (valid JSX) --- */
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
function Debug({ info }: { info: string }) {
  return (
    <div style={{ background: '#fff7ed', color: '#9a3412', padding: 6, borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
      DEBUG: {info}
    </div>
  );
}
