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
    gradient_color: '#0b1220',
    theme: 'dark',
  })

  const [image, setImage] = useState<File | null>(null)
  const [mobileImage, setMobileImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  async function upload(file: File) {
    const name = `banner-${Date.now()}-${file.name}`
    await supabase.storage.from('banners').upload(name, file)
    return supabase.storage.from('banners').getPublicUrl(name).data.publicUrl
  }

  async function saveBanner() {
    if (!form.title || !image) {
      alert('Title and image are required')
      return
    }

    setSaving(true)

    const imgUrl = await upload(image)
    const mobileImgUrl = mobileImage ? await upload(mobileImage) : null

    await fetch('/api/admin/banners/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        img: imgUrl,
        mobile_img: mobileImgUrl,
        is_active: true,
        sort_order: 1,
      }),
    })

    router.push('/admin/banners')
  }

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        background: '#020617',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      }}
    >
      <h1 style={{ marginBottom: 20, fontSize: 22 }}>
        ➕ Add Home Banner
      </h1>

      {/* TITLE */}
      <label style={label}>Title</label>
      <input
        style={input}
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
      />

      {/* TEXT */}
      <label style={label}>Description</label>
      <textarea
        style={{ ...input, minHeight: 80 }}
        value={form.text}
        onChange={e => setForm({ ...form, text: e.target.value })}
      />

      {/* IMAGE */}
      <label style={label}>Desktop Banner Image</label>
      <input
        type="file"
        style={input}
        onChange={e => setImage(e.target.files?.[0] ?? null)}
      />

      {/* MOBILE IMAGE */}
      <label style={label}>Mobile Banner Image (optional)</label>
      <input
        type="file"
        style={input}
        onChange={e => setMobileImage(e.target.files?.[0] ?? null)}
      />

      {/* CTA */}
      <label style={label}>Button Label</label>
      <input
        style={input}
        value={form.cta_label}
        onChange={e => setForm({ ...form, cta_label: e.target.value })}
      />

      <label style={label}>Button Link</label>
      <input
        style={input}
        value={form.cta_href}
        onChange={e => setForm({ ...form, cta_href: e.target.value })}
      />

      {/* DESIGN OPTIONS */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
        <div>
          <label style={label}>Gradient Color</label>
          <input
            type="color"
            value={form.gradient_color}
            onChange={e =>
              setForm({ ...form, gradient_color: e.target.value })
            }
          />
        </div>

        <div>
          <label style={label}>Theme</label>
          <select
            style={input}
            value={form.theme}
            onChange={e => setForm({ ...form, theme: e.target.value })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
      </div>

      {/* SAVE */}
      <button
        onClick={saveBanner}
        disabled={saving}
        style={{
          marginTop: 24,
          background: '#f59e0b',
          color: '#111827',
          border: 'none',
          padding: '12px 20px',
          fontWeight: 700,
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        {saving ? 'Saving…' : '✅ Save Banner'}
      </button>
    </main>
  )
}

/* ===== Styles ===== */

const label: React.CSSProperties = {
  display: 'block',
  marginTop: 14,
  marginBottom: 6,
  color: '#cbd5e1',
  fontSize: 13,
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #1f2937',
  background: '#020617',
  color: '#e5e7eb',
}
