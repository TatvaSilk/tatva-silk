import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import AddToCart from '@/components/AddToCart'
import ProductGallery, { ProductImage } from '@/components/ProductGallery'

export const revalidate = 30

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data } = await supabase.from('products').select('name').eq('id', params.id).single()
  return { title: data?.name ? `${data.name} • Tatva Silk` : 'Product • Tatva Silk' }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const productId = params.id

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      original_price,
      offer_price,
      stock,
      is_active,
      categories:category_id ( slug, label ),
      product_images ( url, alt, sort_order )
    `)
    .eq('id', productId)
    .limit(1)
    .single()

  if (error) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        /products← Back to products</Link>
        <h1 style={{ marginTop: 12 }}>Product</h1>
        <p style={{ color: 'crimson' }}>Failed to load product: {error.message}</p>
      </main>
    )
  }

  const row: any = data ?? {}
  // normalize relation (object or array)
  const catRel = Array.isArray(row.categories) ? (row.categories[0] ?? null) : (row.categories ?? null)
  const catLabel: string | null = catRel?.label ?? null
  const catSlug: string = (catRel?.slug ?? '')?.toLowerCase() || ''

  const images: ProductImage[] = (row.product_images ?? []) as ProductImage[]
  const effectivePrice =
    typeof row.offer_price === 'number' ? row.offer_price : (row.original_price as number | null)

  if (!row?.id || row.is_active === false) {
    return (
      <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
        /products← Back to products</Link>
        <h1 style={{ marginTop: 12 }}>Product not found</h1>
        <p style={{ color: '#666' }}>This product does not exist or is inactive.</p>
      </main>
    )
  }

  // Toggle Buy Now with an env var to avoid 404 if you don't have a checkout route yet
  const enableBuyNow = process.env.NEXT_PUBLIC_ENABLE_BUY_NOW === 'true'
  const buyNowHref = `/checkout?product=${encodeURIComponent(String(row.id))}&qty=1`

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 8, fontSize: 14 }}>
        /products← Back to products</Link>
        {catSlug ? (
          <>
            <span style={{ color: '#aaa', margin: '0 8px' }}>/</span>
            <Link href={`/products?category=${encodeURIComponent(catSlug)}`} className="hover:underline">
              {(catLabel ?? catSlug).toLowerCase()}
            </Link>
          </>
        ) : null}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
        {/* Left: improved gallery */}
        <ProductGallery images={images} name={row.name} />

        {/* Right: details */}
        <div>
          <h1 style={{ margin: '0 0 6px' }}>{row.name ?? 'Untitled'}</h1>
          {catLabel ? (
            <div style={{ color: '#777', fontSize: 14, marginBottom: 12 }}>{catLabel.toLowerCase()}</div>
          ) : null}

          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatInr(effectivePrice)}
            {typeof row.offer_price === 'number' && typeof row.original_price === 'number' ? (
              <span style={{ color: '#888', marginLeft: 10, textDecoration: 'line-through', fontWeight: 400 }}>
                {formatInr(row.original_price)}
              </span>
            ) : null}
          </div>

          {typeof row.stock === 'number' ? (
            <div style={{ color: '#555', fontSize: 14, marginTop: 8 }}>Stock: {row.stock}</div>
          ) : null}

          {row.description ? (
            <div style={{ marginTop: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{row.description}</div>
          ) : null}

          {/* Actions — single Add to Cart + optional Buy Now */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
            <AddToCart
              productId={String(row.id)}
              inStock={(row.stock ?? 0) > 0}
              variantId={undefined}
            />
            {enableBuyNow && (
              <Link
                href={buyNowHref}
                style={{
                  background: '#f59e0b',
                  color: '#111827',
                  padding: '8px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                }}
              >
                Buy Now
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
