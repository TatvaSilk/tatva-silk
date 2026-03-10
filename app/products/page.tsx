import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 30 // Rebuild at most once every 30s

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null }
type Product = {
  id: string
  name: string | null
  original_price: number | null
  offer_price: number | null
  stock: number | null
  is_active?: boolean | null
  categories?: { slug: string | null; label: string | null } | null
  product_images?: ProductImage[]
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

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  const categorySlug = (Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category) as string | undefined

  // Join categories via category_id; if filtering by slug, use inner join; else left is fine
  let selectRel = `
      id,
      name,
      original_price,
      offer_price,
      stock,
      is_active,
      categories:category_id!inner ( slug, label ),
      product_images ( url, alt, sort_order )
    `

  let query = supabase
    .from('products')
    .select(selectRel)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (categorySlug && categorySlug.trim().length > 0) {
    query = query.eq('categories.slug', categorySlug.toLowerCase())
  }

  const { data, error } = await query
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        {categorySlug ? (
          <div style={{ fontSize: 14, color: '#555' }}>
            <span>Filtered by: </span>
            <strong style={{ textTransform: 'capitalize' }}>{categorySlug}</strong>
            <span style={{ margin: '0 8px' }}>|</span>
            <Link href="/products">Clear filter</Link>
          </div>
        ) : null}
      </div>

      {products.length === 0 ? (
        <p style={{ color: '#666' }}>
          {categorySlug ? `No products found in "${categorySlug}".` : 'No products found.'}
        </p>
      ) : (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {products.map((p) => {
            const effectivePrice =
              typeof p.offer_price === 'number' ? p.offer_price : p.original_price
            const firstImage = pickFirstImage(p)
            const label = p.categories?.label ?? null
            const slug = (p.categories?.slug ?? '')?.toLowerCase() || ''

            return (
              <article key={p.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                {firstImage ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: 180,
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
                    <Image
                      src={firstImage.url!}
                      alt={firstImage.alt ?? p.name ?? 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : null}

                <h3 style={{ margin: '8px 0 4px' }}>{p.name ?? 'Untitled'}</h3>

                {label ? (
                  <div style={{ color: '#777', fontSize: 12, marginBottom: 6 }}>
                    <Link
                      href={`/products?category=${encodeURIComponent(slug)}`}
                      className="hover:underline"
                    >
                      {label.toLowerCase()}
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
            )
          })}
        </section>
      )}
    </main>
  )
}
``
