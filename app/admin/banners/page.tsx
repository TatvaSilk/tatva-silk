'use client'

import { useEffect, useState }/link'import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Banner = {
  id: string
  title: string
  text: string
  cta_label: string
  cta_href: string
  img: string
  is_active: boolean
  sort_order: number
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)

  async function loadBanners() {
    const { data } = await supabase
      .from('home_banners')
      .select('*')
      .order('sort_order')

    setBanners(data ?? [])
    setLoading(false)
  }

  async function toggleActive(id: string, value: boolean) {
    await supabase
      .from('home_banners')
      .update({ is_active: value })
      .eq('id', id)

    loadBanners()
  }

  async function remove(id: string) {
    if (!confirm('Delete this banner?')) return

    await supabase
      .from('home_banners')
      .delete()
      .eq('id', id)

    loadBanners()
  }

  useEffect(() => {
    loadBanners()
  }, [])

  if (loading) {
    return <div style={{ padding: 20 }}>Loading banners…</div>
  }

  return (
    <main style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Home Banners</h1>
        /admin/banners/newNew Banner</Link>
      </div>

      {banners.length === 0 ? (
        <p>No banners found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151', textAlign: 'left' }}>
              <th>Title</th>
              <th>Image</th>
              <th>Active</th>
              <th>Order</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {banners.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td>{b.title}</td>
                <td style={{ maxWidth: 200 }}>
                  {b.img}
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={b.is_active}
                    onChange={e => toggleActive(b.id, e.target.checked)}
                  />
                </td>
                <td>{b.sort_order}</td>
                <td style={{ textAlign: 'right' }}>
                  /admin/banners/${b.id}Edit</Link>
                  <button
                    onClick={() => remove(b.id)}
                    style={{ marginLeft: 8 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}

