// app/products/[id]/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import AddToCart from '@/components/AddToCart' // ✅ restore Add to Cart

export const revalidate = 30

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null }

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}
function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u)
}
function sortAndFilterImages(images: ProductImage[] = []) {
  return images
    .filter((img) => isValidHttpUrl(img.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
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
  // categories can be object or array depending on introspection; normalize
  const catRel = Array.isArray(row.categories) ? (row.categories[0] ?? null) : (row.categories ?? null)
  const catLabel: string | null = catRel?.label ?? null
  const catSlug: string = (catRel?.slug ?? '')?.toLowerCase() || ''

  const images: ProductImage[] = sortAndFilterImages((row.product_images ?? []) as ProductImage[])
  const mainImage = images[0] ?? null
  const thumbnails = images.slice(1)
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
        {/* Left: gallery */}
        <div>
          {mainImage ? (
            <div style={{ display: 'grid', gap: 12 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 420,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #eee',
                }}
              >
                <Image
                  src={mainImage.url!}
                  alt={mainImage.alt ?? row.name ?? 'Product image'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>

              {thumbnails.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                    gap: 8,
                  }}
                >
                  {thumbnails.map((img, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 90,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid #eee',
                      }}
                    >
                      <Image
                        src={img.url!}
                        alt={img.alt ?? row.name ?? 'Product image'}
                        fill
                        sizes="(max-width: 1024px) 25vw, 15vw"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
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
                color: '#888',
              }}
            >
              No images
            </div>
          )}
        </div>

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
            <div style={{ marginTop: 16, lineHeight: 1.6 }}>{row.description}</div>
          ) : null}

          {/* ✅ Restore actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16 }}>
            <AddToCart
              productId={String(row.id)}
              inStock={(row.stock ?? 0) > 0}
              variantId={undefined}
            />
            <Link
              href={`/checkout?product=${encodeURIComponent(String(row.id))}&qty=1`}
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
          </div>
        </div>
      </section>
    </main>
  )
}
