// app/products/page.tsx
import { supabase } from '@/lib/supabase'

export const revalidate = 30 // Rebuild at most once every 30s

type Product = {
  id: string
  name: string | null
  category: string | null
  original_price: number | null
  offer_price: number | null
  stock: number | null
  is_active?: boolean | null
  product_images?: { url: string | null; alt: string | null; sort_order: number | null }[]
}

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u)
}

function pickFirstImage(p: Product) {
  const imgs = (p.product_images ?? [])
    .filter((img) => isValidHttpUrl(img.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
  return imgs[0] ?? null
}

export default async function ProductsPage() {
  // Fetch products + related images (requires FK)
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      original_price,
      offer_price,
      stock,
      is_active,
      product_images ( url, alt, sort_order )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <h1>Products</h1>
        <p style={{ color: 'crimson' }}>Failed to load products: {error.message}</p>
      </main>
    )
  }

  const products = (data ?? []) as Product[]

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Products</h1>

      {products.length === 0 ? (
        <p style={{ color: '#666' }}>No products found.</p>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16
          }}
        >
          {products.map((p) => {
            const effectivePrice =
              typeof p.offer_price === 'number' ? p.offer_price : p.original_price
            const firstImage = pickFirstImage(p)

            return (
              <article key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {/* Image */}
                {firstImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstImage.url!}
                    alt={firstImage.alt ?? p.name ?? 'Product image'}
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 8
                    }}
                  />
                ) : null}

                {/* Name */}
                <h3 style={{ margin: '8px 0 4px' }}>{p.name ?? 'Untitled'}</h3>

                {/* Category */}
                {p.category ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>{p.category}</div>
                ) : null}

                {/* Price */}
                <div style={{ fontWeight: 600 }}>
                  {formatInr(effectivePrice)}
                  {typeof p.offer_price === 'number' && typeof p.original_price === 'number' ? (
                    <span style={{ color: '#888', marginLeft: 8, textDecoration: 'line-through', fontWeight: 400 }}>
                      {formatInr(p.original_price)}
                    </span>
                  ) : null}
                </div>

                {/* Stock */}
                {typeof p.stock === 'number' ? (
                  <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>Stock: {p.stock}</div>
                ) : null}

                {/* Link */}
                <div style={{ marginTop: 10 }}>
                  <a href={`/products/${p.id}`} style={{ color: '#2563eb' }}>
                    View details →
                  </a>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
