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
}

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export default async function ProductsPage() {
  // Only select columns that exist in your table
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category, original_price, offer_price, stock, is_active')
    .eq('is_active', true) // show only active items
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16
          }}
        >
          {products.map((p) => {
            const effectivePrice =
              typeof p.offer_price === 'number' ? p.offer_price : p.original_price

            return (
              <article key={p.id} className="card" style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {/* Name */}
                <h3 style={{ margin: '8px 0 4px' }}>{p.name ?? 'Untitled'}</h3>

                {/* Category (optional) */}
                {p.category ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                    {p.category}
                  </div>
                ) : null}

                {/* Price (offer → original) */}
                <div style={{ fontWeight: 600, marginTop: 6 }}>
                  {formatInr(effectivePrice)}
                  {typeof p.offer_price === 'number' && typeof p.original_price === 'number' ? (
                    <span style={{ color: '#888', marginLeft: 8, textDecoration: 'line-through', fontWeight: 400 }}>
                      {formatInr(p.original_price)}
                    </span>
                  ) : null}
                </div>

                {/* Stock (optional) */}
                {typeof p.stock === 'number' ? (
                  <div style={{ color: '#555', fontSize: 12, marginTop: 6 }}>
                    Stock: {p.stock}
                  </div>
                ) : null}

                {/* Link to detail page — we’ll implement [id] route next */}
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
