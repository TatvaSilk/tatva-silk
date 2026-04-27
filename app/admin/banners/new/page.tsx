'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function NewBannerPage() {
  const router = useRouter()

  const [form, setForm] = useState({
    title: '',
    text: '',
    cta_label: '',
    cta_href: '',
    img: '',
    sort_order: 1,
    is_active: true,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveBanner() {
    setSaving(true)
    setError(null)

    if (!form.title || !form.img) {
      setError('Title and Image URL are required')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('home_banners')
      .insert(form)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    // ✅ Go back to banner list
    router.push('/admin/banners')
  }

  return (
    <main style={{ padding: 20, maxWidth: 640 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Add New Banner</h1>

      {error && (
        <p style={{ color: 'crimson', marginBottom: 12 }}>{error}</p>
      )}

      <label>
        Title
        <input
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label>
        Description
        <textarea
          value={form.text}
          onChange={e => setForm({ ...form, text: e.target.value })}
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label>
        Image URL
        <input
          value={form.img}
          onChange={e => setForm({ ...form, img: e.target.value })}
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label>
        Button Label
        <input
          value={form.cta_label}
          onChange={e =>
            setForm({ ...form, cta_label: e.target.value })
          }
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label>
        Button Link
        <input
          value={form.cta_href}
          onChange={e =>
            setForm({ ...form, cta_href: e.target.value })
          }
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label>
        Sort Order
        <input
          type="number"
          value={form.sort_order}
          onChange={e =>
            setForm({ ...form, sort_order: Number(e.target.value) })
          }
          style={{ width: '100%', marginBottom: 10 }}
        />
      </label>

      <label style={{ display: 'block', marginBottom: 16 }}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={e =>
            setForm({ ...form, is_active: e.target.checked })
          }
        />{' '}
        Active
      </label>

      <button onClick={saveBanner} disabled={saving}>
        {saving ? 'Saving…' : 'Save Banner'}
      </button>
    </main>
  )
}
