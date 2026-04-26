// app/products/[id]/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Metadata } from 'next'
import AddToCartLite from '@/components/AddToCartLite'
import BuyNowButton from '@/components/BuyNowButton'

export const revalidate = 30

type ProductImage = {
  url: string | null
  alt: string | null
  sort_order: number | null
}

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

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const { data } = await supabase
    .from('products')
    .select('name')
    .eq('id', params.id)
    .single()

  return {
    title: data?.name ? `${data.name} • Tatva Silk` : 'Product • Tatva Silk',
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
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
      product_images ( url, alt, sort_order )
    `)
    .eq('id', productId)
    .maybeSingle()

  if (error || !data || data.is_active === false) {
    return (
      <main style={{ padding: 40 }}>
        <Link href="/products">← Back to products</Link>
        <h1 style={{ marginTop: 16 }}>Product not found</h1>
      </main>
    )
  }

  const row: any = data
  const images = sortAndFilterImages(row.product_images ?? [])
  const mainImage = images[0] ?? null

  const effectivePrice =
    typeof row.offer_price === 'number'
      ? row.offer_price
      : row.original_price

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <Link href="/products">← Back to products</Link>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* LEFT: IMAGE */}
        <div>
          {mainImage ? (
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
          ) : (
            <div
              style={{
                width: '100%',
                height: 420,
                border: '1px dashed #ccc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              No image
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div>
          <h1 style={{ marginBottom: 8 }}>{row.name}</h1>

          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {formatInr(effectivePrice)}
            {typeof row.offer_price === 'number' &&
            typeof row.original_price === 'number' ? (
              <span
                style={{
                  marginLeft: 10,
                  color: '#888',
                  textDecoration: 'line-through',
                  fontWeight: 400,
                }}
              >
                {formatInr(row.original_price)}
              </span>
            ) : null}
          </div>

          {typeof row.stock === 'number' && (
            <div style={{ marginTop: 8, color: '#555' }}>
              Stock: {row.stock}
            </div>
          )}

          {row.description && (
            <div
              style={{
                marginTop: 16,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {row.description}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
              alignItems: 'center',
            }}
          >
            <AddToCartLite productId={String(row.id)} qty={1} />
            <BuyNowButton productId={String(row.id)} />
          </div>
        </div>
      </section>
    </main>
  )
}
