// app/products/[id]/page.tsx
import Link from 'next/link';

export const revalidate = 0;

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null };
type Detail = {
  id: string;
  name: string | null;
  description: string | null;
  original_price: number | null;
  offer_price: number | null;
  stock: number | null;
  category: { id: string; slug: string; label: string } | null;
  images: ProductImage[];
  primary_image_url: string | null;
};

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

async function getProduct(id: string): Promise<Detail | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? '';
  const res = await fetch(`${base}/api/store/products/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return await res.json();
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);

  if (!p) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <Link href="/products">← Back to products</Link>
        <h1 style={{ marginTop: 12 }}>Product not found</h1>
        <p style={{ color: '#666' }}>This product does not exist or is inactive.</p>
      </main>
    );
  }

  const effectivePrice = typeof p.offer_price === 'number' ? p.offer_price : p.original_price;

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        <Link href="/products">← Back to products</Link>
        {p.category ? (
          <>
            <span style={{ color: '#aaa', margin: '0 8px' }}>/</span>
            <Link href={`/products?category=${encodeURIComponent(p.category.slug)}`} className="hover:underline">
              {p.category.label.toLowerCase()}
            </Link>
          </>
        ) : null}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        {/* Left: gallery */}
        <div>
          <div style={{ position:'relative', width:'100%', height: 420, borderRadius: 8, overflow:'hidden', border:'1px solid #eee', marginBottom: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.primary_image_url ?? '/placeholder.png'}
              alt={p.name ?? 'Product image'}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
          </div>

          {p.images?.length > 1 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(90px,1fr))', gap: 8 }}>
              {p.images.slice(1).map((img, i) => (
                <div key={i} style={{ position:'relative', width:'100%', height: 90, borderRadius: 6, overflow:'hidden', border:'1px solid #eee' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url ?? ''} alt={img.alt ?? p.name ?? 'Product image'} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div>
          <h1 style={{ margin: '0 0 6px' }}>{p.name ?? 'Untitled'}</h1>
          {p.category ? (
            <div style={{ color: '#777', fontSize: 14, marginBottom: 12 }}>{p.category.label.toLowerCase()}</div>
          ) : null}

          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatInr(effectivePrice)}
            {typeof p.offer_price === 'number' && typeof p.original_price === 'number' ? (
              <span style={{ color:'#888', marginLeft: 10, textDecoration: 'line-through', fontWeight: 400 }}>
                {formatInr(p.original_price)}
              </span>
            ) : null}
          </div>

          {typeof p.stock === 'number' ? (
            <div style={{ color:'#555', fontSize: 14, marginTop: 8 }}>Stock: {p.stock}</div>
          ) : null}

          {p.description ? (
            <div style={{ marginTop: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.description}</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
