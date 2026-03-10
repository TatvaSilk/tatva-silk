// app/products/page.tsx
import Link from 'next/link';

export const revalidate = 0;

type Card = {
  id: string;
  name: string | null;
  original_price: number | null;
  offer_price: number | null;
  stock: number | null;
  category_label?: string | null;
  primary_image_url?: string | null;
};

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

async function fetchProducts(category?: string) {
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const url = `${base}/api/store/products${qs.size ? `?${qs}` : ''}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { items: [] as Card[], total: 0 };
  return (await res.json()) as { items: Card[]; total: number };
}

export default async function ProductsPage({ searchParams }: { searchParams?: Record<string, string | undefined> }) {
  const category = searchParams?.category;
  const { items } = await fetchProducts(category);

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        {category ? (
          <div style={{ fontSize: 14, color: '#555' }}>
            <span>Filtered by: </span>
            <strong style={{ textTransform: 'capitalize' }}>{category}</strong>
            <span style={{ margin: '0 8px' }}>|</span>
            <Link href="/products">Clear filter</Link>
          </div>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p style={{ color: '#666' }}>
          {category ? `No products found in "${category}".` : 'No products found.'}
        </p>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {items.map((p) => {
            const effectivePrice =
              typeof p.offer_price === 'number' ? p.offer_price : p.original_price;

            return (
              <article key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {p.primary_image_url ? (
                  <div
                    style={{
                      width: '100%',
                      height: 180,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 8,
                      border: '1px solid #eee',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.primary_image_url}
                      alt={p.name ?? 'Product image'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                ) : null}

                <h3 style={{ margin: '8px 0 4px' }}>{p.name ?? 'Untitled'}</h3>

                {p.category_label ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                    <Link
                      href={`/products?category=${encodeURIComponent(p.category_label.toLowerCase())}`}
                      className="hover:underline"
                    >
                      {p.category_label.toLowerCase()}
                    </Link>
                  </div>
                ) : null}

                <div style={{ fontWeight: 600 }}>{formatInr(effectivePrice)}</div>

                <div style={{ marginTop: 10 }}>
                  <Link href={`/products/${p.id}`} style={{ color: '#2563eb' }}>
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
