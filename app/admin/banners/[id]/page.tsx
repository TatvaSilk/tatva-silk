'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdminBannerPreview from '@/components/AdminBannerPreview'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditBannerPage() {
  const { id } = useParams()
  const router = useRouter()

  const [preview, setPreview] = useState<'desktop' | 'mobile'>('desktop')
  const [form, setForm] = useState<any>({
    title: '',
    text: '',
    gradient_color: '#0b1220',
    theme: 'dark',
    img: '',
    mobile_img: '',
  })

  const [newImage, setNewImage] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => data && setForm(data))
  }, [id])

  async function upload(file: File) {
    const name = `${Date.now()}-${file.name}`
    await supabase.storage.from('banners').upload(name, file)
    return supabase.storage.from('banners').getPublicUrl(name).data.publicUrl
  }

  async function save() {
    setSaving(true)

    let imgUrl = form.img
    if (newImage) imgUrl = await upload(newImage)

    await fetch('/api/admin/banners/update', {
      method: 'PUT',
      body: JSON.stringify({ ...form, id, img: imgUrl }),
    })

    router.push('/admin/banners')
  }

  return (
    <main style={card}>
      <h2>Edit Banner</h2>

      {/* Toggle */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setPreview('desktop')}>Desktop</button>
        <button onClick={() => setPreview('mobile')}>Mobile</button>
      </div>

      <input
        style={input}
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        placeholder="Title"
      />

      <textarea
        style={input}
        value={form.text}
        onChange={e => setForm({ ...form, text: e.target.value })}
        placeholder="Description"
      />

      <input type="file" onChange={e => setNewImage(e.target.files?.[0] ?? null)} />

      <label>Gradient</label>
      <input
        type="color"
        value={form.gradient_color}
        onChange={e =>
          setForm({ ...form, gradient_color: e.target.value })
        }
      />

      <select
        value={form.theme}
        onChange={e => setForm({ ...form, theme: e.target.value })}
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>

      {/* LIVE PREVIEW */}
      <AdminBannerPreview
        title={form.title}
        text={form.text}
        image={preview === 'mobile' && form.mobile_img ? form.mobile_img : form.img}
        gradient={form.gradient_color}
        theme={form.theme}
        preview={preview}
      />

      <button onClick={save} disabled={saving} style={saveBtn}>
        Save Changes
      </button>
    </main>
  )
}

const card = {
  maxWidth: 760,
  margin: '0 auto',
  background: '#020617',
  padding: 24,
  borderRadius: 14,
} as React.CSSProperties

const input = {
  width: '100%',
  marginBottom: 12,
  padding: 10,
  background: '#020617',
  color: '#fff',
  borderRadius: 8,
  border: '1px solid #334155',
} as React.CSSProperties

const saveBtn = {
  marginTop: 16,
  padding: '12px 20px',
  background: '#f59e0b',
  fontWeight: 700,
  borderRadius: 8,
} as React.CSSProperties
``
