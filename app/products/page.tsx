// app/products/page.tsx
import { supabase } from '@/lib/supabase'

export const revalidate = 30 // Revalidate at most once every 30s

type Product = {
  id: string
  name: string
  price: number | null
  image_url: string | null
  category: string | null
}

export default async function ProductsPage() {
  // Fetch products (adjust columns if your table differs)
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, image_url, category')
    .order('name', { ascending: true })

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
          {products.map((p) => (
            <article key={p.id} className="card">
              {/* Image */}
              {p.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image_url}
                  alt={p.name}
                  style={{
                    width: '100%',
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 8
                  }}
                />
              ) : null}

              {/* Name */}
              <h3 style={{ margin: '12px 0 4px' }}>{p.name}</h3>

              {/* Category (optional) */}
              {p.category ? (
                <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                  {p.category}
                </div>
              ) : null}

              {/* Price (₹ for INR as per your example) */}
              <div style={{ fontWeight: 600 }}>
                {typeof p.price === 'number'
                  ? `₹${p.price.toLocaleString('en-IN')}`
                  : '—'}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
