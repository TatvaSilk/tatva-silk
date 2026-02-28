// app/products/page.tsx
import { supabase } from '@/lib/supabase'

export const revalidate = 30 // Revalidate at most once every 30s

// Flexible product shape – we don't assume exact columns
type Product = {
  id: string | number
  name?: string | null
  image_url?: string | null
  category?: string | null
  // Any possible price fields (optional)
  price?: number | null
  price_inr?: number | null
  price_cents?: number | null
  mrp?: number | null
  sale_price?: number | null
  amount?: number | null
  [key: string]: unknown
}

function pickPrice(p: Product): { value: number | null; formatted: string } {
  // Try a list of common field names
  const candidates = [
    p.price,
    p.price_inr,
    p.sale_price,
    p.mrp,
    p.amount,
    // If stored as cents/paise:
    typeof p.price_cents === 'number' ? p.price_cents / 100 : null
  ]

  const value = candidates.find((v) => typeof v === 'number') ?? null
  if (value === null) return { value: null, formatted: '—' }

  // Format as INR (₹) – adjust if you prefer USD
  return { value, formatted: `₹${Number(value).toLocaleString('en-IN')}` }
}

export default async function ProductsPage() {
  // Select everything to avoid "column does not exist" errors
  const { data, error } = await supabase.from('products').select('*')

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <h1>Products</h1>
        <p style={{ color: 'crimson' }}>
          Failed to load products: {error.message}
        </p>
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          {products.map((p) => {
            const { formatted } = pickPrice(p)
            return (
              <article key={String(p.id)} className="card">
                {/* Image */}
                {p.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.image_url}
                    alt={p.name ?? 'Product image'}
                    style={{
                      width: '100%',
                      height: 180,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                ) : null}

                {/* Name */}
                <h3 style={{ margin: '12px 0 4px' }}>{p.name ?? 'Untitled'}</h3>

                {/* Category (optional) */}
                {p.category ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                    {p.category}
                  </div>
                ) : null}

                {/* Price */}
                <div style={{ fontWeight: 600 }}>{formatted}</div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
