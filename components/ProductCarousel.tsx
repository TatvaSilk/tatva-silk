// components/ProductCarousel.tsx
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AutoScrollRow from '@/components/AutoScrollRow' // ✅ new

type ProductRow = {
  id: string
  name: string | null
  category: string | null
  original_price: number | null
  offer_price: number | null
  product_images?: { url: string | null; alt: string | null; sort_order: number | null }[]
}

function formatINR(n: number | null | undefined) {
  if (typeof n !== 'number') return '—'
  return `₹${n.toLocaleString('en-IN')}`
}

function bestImage(p: ProductRow) {
  const imgs = (p.product_images ?? [])
    .filter((i) => typeof i.url === 'string' && /^https?:\/\//.test(i.url!))
    .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999))
  return imgs[0]?.url ?? null
}

export default async function ProductCarousel(props: {
  title: string
  where?: { categoryEquals?: string; dealOnly?: boolean }
  limit?: number
  /** optional auto-scroll speed (px/second). Defaults to 40. */
  speed?: number
}) {
  const limit = props.limit ?? 10

  let query = supabase
    .from('products')
    .select(`
      id, name, category, original_price, offer_price,
      product_images ( url, alt, sort_order )
    `)
    .eq('is_active', true)

  if (props.where?.categoryEquals) query = query.eq('category', props.where.categoryEquals)
  if (props.where?.dealOnly) query = query.not('offer_price', 'is', null)

  const { data, error } = await query.order('name', { ascending: true }).limit(limit)
  if (error) {
    return (
      <div className="container">
        <h3 className="section-title">{props.title}</h3>
        <p style={{ color: 'crimson' }}>Failed to load: {error.message}</p>
      </div>
    )
  }

  const rows = (data ?? []) as ProductRow[]

  return (
    <div className="container">
      <h3 className="section-title">{props.title}</h3>

      {/* ✅ Auto-scrolling row. Increase/decrease speed to taste, e.g., speed={55} */}
      <AutoScrollRow className="carousel" speed={props.speed ?? 40}>
        {rows.map((p) => {
          const img = bestImage(p)
          const price =
            typeof p.offer_price === 'number' ? p.offer_price : p.original_price
          const hasDeal =
            typeof p.offer_price === 'number' && typeof p.original_price === 'number'

          return (
            <article key={p.id} className="card">
              <div className="card-img">
                {img ? (
                  <Image
                    src={img}
                    alt={p.name ?? 'Product image'}
                    fill
                    sizes="220px"
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: 12,
                    }}
                  >
                    No image
                  </div>
                )}
              </div>

              <div className="card-body">
                <div className="card-name">{p.name ?? 'Untitled'}</div>
                <div className="card-meta">{p.category ?? ''}</div>
                <div className="price">{formatINR(price)}</div>

                <div className="badges">
                  {hasDeal ? <span className="badge badge--deal">Limited time</span> : null}
                  {typeof price === 'number' && price <= 1000 ? (
                    <span className="badge badge--under1k">Under ₹1000</span>
                  ) : null}
                  {p.category ? (
                    <span className="badge" style={{ background: 'var(--ts-ink)' }}>
                      {p.category}
                    </span>
                  ) : null}
                </div>

                <Link href={`/products/${p.id}`} style={{ color: '#2563eb', fontSize: 13, marginTop: 2 }}>
                  View details →
                </Link>
              </div>
            </article>
          )
        })}
      </AutoScrollRow>
    </div>
  )
}
