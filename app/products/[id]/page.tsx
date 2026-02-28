// app/products/[id]/page.tsx
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'

// Revalidate each product page at most every 60s (ISR)
export const revalidate = 60

type ProductImage = {
  url: string
  alt: string | null
  sort_order: number | null
}

type Product = {
  id: string
  name: string | null
  description: string | null
  category: string | null
  original_price: number | null
  offer_price: number | null
  stock: number | null
  is_active: boolean | null
  product_images?: ProductImage[]
}

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function pickSortedImages(images: ProductImage[] = []) {
  return images
    .slice()
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
}

// --- Optional: SEO metadata (title shows product name) ---
export async function generateMetadata({
  params
}: {
  params: { id: string }
}): Promise<Metadata> {
  const { data } = await supabase
    .from('products')
    .select('name')
    .eq('id', params.id)
    .single()

  return {
    title: data?.name ? `${data.name} • Tatva Silk` : 'Product • Tatva Silk'
  }
}

// --- Page component ---
export default async function ProductDetailPage({
  params
}: {
  params: { id: string }
}) {
  const productId = params.id

  // Fetch one product + its images
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      description,
      category,
      original_price,
      offer_price,
      stock,
      is_active,
      product_images (
        url,
        alt,
        sort_order
      )
    `
    )
    .eq('id', productId)
    .limit(1)
    .single()

  if (error) {
    // You can customize this error UI
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <a href="/products" style={{ color: '#2563eb' }}>← Back to products</a>
        <h1 style={{ marginTop: 12 }}>Product</h1>
        <p style={{ color: 'crimson' }}>Failed to load product: {error.message}</p>
      </main>
    )
  }

  const p = (data ?? {}) as Product

  // If not active or missing, show a friendly not-found
  if (!p?.id || p.is_active === false) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        <a href="/products" style={{ color: '#2563eb' }}>← Back to products</a>
        <h1 style={{ marginTop: 12 }}>Product not found</h1>
        <p style={{ color: '#666' }}>This product does not exist or is inactive.</p>
      </main>
    )
  }

  const images = pickSortedImages(p.product_images ?? [])
  const effectivePrice =
    typeof p.offer_price === 'number' ? p.offer_price : p.original_price

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <a href="/products" style={{ color: '#2563eb' }}>← Back to products</a>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
        {/* Left: Image gallery */}
        <div>
          {images.length > 0 ? (
            <div style={{ display: 'grid', gap: 12 }}>
              {/* Main image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[0].url}
                alt={images[0].alt ?? p.name ?? 'Product image'}
                style={{
                  width: '100%',
                  height: 420,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid #eee'
                }}
              />
              {/* Thumbnails (if more) */}
              {images.length > 1 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
                  {images.slice(1).map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={img.url}
                      alt={img.alt ?? p.name ?? 'Product image'}
                      style={{
                        width: '100%',
                        height: 90,
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid #eee'
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                width: '100%',
                height: 420,
                borderRadius: 8,
                border: '1px dashed #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888'
              }}
            >
              No images
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div>
          <h1 style={{ margin: '0 0 6px' }}>{p.name ?? 'Untitled'}</h1>
          {p.category ? (
            <div style={{ color: '#777', fontSize: 14, marginBottom: 12 }}>
              {p.category}
            </div>
          ) : null}

          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatInr(effectivePrice)}
            {typeof p.offer_price === 'number' && typeof p.original_price === 'number' ? (
              <span style={{ color: '#888', marginLeft: 10, textDecoration: 'line-through', fontWeight: 400 }}>
                {formatInr(p.original_price)}
              </span>
            ) : null}
          </div>

          {/* Stock */}
          {typeof p.stock === 'number' ? (
            <div style={{ color: '#555', fontSize: 14, marginTop: 8 }}>
              Stock: {p.stock}
            </div>
          ) : null}

          {/* Description */}
          {p.description ? (
            <div style={{ marginTop: 16, lineHeight: 1.6 }}>
              {p.description}
            </div>
          ) : null}

          {/* (Future) Add to cart button could go here */}
        </div>
      </section>
    </main>
  )
}
