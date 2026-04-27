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
  const [form, setForm] = useState<any>({
    title: '',
    text: '',
    cta_label: '',
    cta_href: '',
    gradient_color: '#0b1220',
    theme: 'dark',
    sort_order: 1,
    is_active: true,
  })
  const [img, setImg] = useState<File | null>(null)
  const [mobileImg, setMobileImg] = useState<File | null>(null)

  async function upload(file: File) {
    const name = `${Date.now()}-${file.name}`
    await supabase.storage.from('banners').upload(name, file)
    return supabase.storage.from('banners').getPublicUrl(name).data.publicUrl
  }

  async function save() {
    const res = await fetch('/api/admin/banners/create', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        img: img ? await upload(img) : null,
        mobile_img: mobileImg ? await upload(mobileImg) : null,
      }),
    })
    if (res.ok) router.push('/admin/banners')
  }

  return (
    <main style={{ maxWidth: 600 }}>
      <h2>Add Banner</h2>

      <input placeholder="Title" onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea placeholder="Text" onChange={e => setForm({ ...form, text: e.target.value })} />

      <input type="file" onChange={e => setImg(e.target.files?.[0] ?? null)} />
      <input type="file" onChange={e => setMobileImg(e.target.files?.[0] ?? null)} />

      <input placeholder="Button Label" onChange={e => setForm({ ...form, cta_label: e.target.value })} />
      <input placeholder="Button Link" onChange={e => setForm({ ...form, cta_href: e.target.value })} />

      <label>Gradient</label>
      <input type="color" value={form.gradient_color} onChange={e => setForm({ ...form, gradient_color: e.target.value })} />

      <select onChange={e => setForm({ ...form, theme: e.target.value })}>
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>

      <button onClick={save}>Save Banner</button>
    </main>
  )
}
