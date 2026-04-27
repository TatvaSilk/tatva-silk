'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
  const [dragId, setDragId] = useState<string | null>(null)

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
    await supabase.from('home_banners').delete().eq('id', id)
    loadBanners()
  }

  async function reorder(from: string, to: string) {
    if (from === to) return

    await fetch('/api/admin/banners/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to }),
    })

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22 }}>🏷️ Home Banners</h1>
        <Link href="/admin/banners/new">+ New Banner</Link>
      </div>

      {banners.length === 0 ? (
        <p>No banners found.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: '#020617',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <th style={th}>Order</th>
              <th style={th}>Title</th>
              <th style={th}>Active</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {banners.map(b => (
              <tr
                key={b.id}
                draggable
                onDragStart={() => setDragId(b.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => dragId && reorder(dragId, b.id)}
                style={{
                  borderBottom: '1px solid #1f2937',
                  cursor: 'grab',
                }}
              >
                <td style={td}>{b.sort_order}</td>
                <td style={td}><strong>{b.title}</strong></td>
                <td style={td}>
                  <input
                    type="checkbox"
                    checked={b.is_active}
                    onChange={e => toggleActive(b.id, e.target.checked)}
                  />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <Link href={`/admin/banners/${b.id}`}>Edit</Link>
                  <button
                    onClick={() => remove(b.id)}
                    style={{
                      marginLeft: 12,
                      background: 'none',
                      border: 'none',
                      color: '#fda4af',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ opacity: 0.6, marginTop: 12 }}>
        ℹ️ Drag rows to reorder banners
      </p>
    </main>
  )
}

/* ===== styles ===== */

const th: React.CSSProperties = {
  padding: 12,
  textAlign: 'left',
  color: '#cbd5e1',
  fontWeight: 600,
}

const td: React.CSSProperties = {
  padding: 12,
  color: '#e5e7eb',
}
