import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 30 // Rebuild at most once every 30s

type ProductImage = { url: string | null; alt: string | null; sort_order: number | null }

function formatInr(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}
function isValidHttpUrl(u?: string | null) {
  return typeof u === 'string' && /^https?:\/\//i.test(u)
}
function pickFirstImage(images: ProductImage[] = []) {
  const imgs = (images ?? [])
    .filter((img) => isValidHttpUrl(img.url))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
  return imgs[0] ?? null
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // We filter by subcategory slug (child), not any legacy text column
  const categorySlug = (Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category) as string | undefined

  // Use inner join only when filtering by slug; otherwise left join is fine
  const categoriesRel = categorySlug
    ? 'categories:category_id!inner ( slug, label )'
    : 'categories:category_id ( slug, label )'

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      original_price,
      offer_price,
      stock,
      is_active,
      ${categoriesRel},
      product_images ( url, alt, sort_order )
    `
    )
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

  const rows: any[] = data ?? []

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Products</h1>
        {categorySlug ? (
          <div style={{ fontSize: 14, color: '#555' }}>
            <span>Filtered by: </span>
            <strong style={{ textTransform: 'capitalize' }}>{categorySlug}</strong>
            <span style={{ margin: '0 8px' }}>|</span>
            /productsClear filter</Link>
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
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
          {rows.map((r) => {
            // Normalize relation (object or array)
            const rel = Array.isArray(r.categories) ? (r.categories[0] ?? null) : (r.categories ?? null)
            const label: string | null = rel?.label ?? null
            const slug: string = (rel?.slug ?? '')?.toLowerCase() || ''
            const firstImage = pickFirstImage((r.product_images ?? []) as ProductImage[])
            const effectivePrice =
              typeof r.offer_price === 'number' ? r.offer_price : (r.original_price as number | null)

            return (
              <article key={r.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
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
                      alt={firstImage.alt ?? r.name ?? 'Product image'}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : null}

                <h3 style={{ margin: '8px 0 4px' }}>{r.name ?? 'Untitled'}</h3>

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
                  <Link href={`/products/${r.id}`} style={{ color: '#2563eb' }}>
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
