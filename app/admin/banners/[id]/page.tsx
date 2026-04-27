'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function EditBannerPage() {
  const router = useRouter()
  const params = useParams()
  const bannerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  const [sortOrder, setSortOrder] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const [newImage, setNewImage] = useState<File | null>(null)

  // ✅ Load existing banner
  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('id', bannerId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
        } else if (data) {
          setTitle(data.title)
          setText(data.text ?? '')
          setCtaLabel(data.cta_label ?? '')
          setCtaHref(data.cta_href ?? '')
          setSortOrder(data.sort_order)
          setIsActive(data.is_active)
          setImageUrl(data.img)
        }
        setLoading(false)
      })
  }, [bannerId])

  async function saveBanner() {
    setSaving(true)
    setError(null)

    let finalImage = imageUrl

    // ✅ Upload new image if selected
    if (newImage) {
      const fileName = `banner-${Date.now()}-${newImage.name}`

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, newImage)

      if (uploadError) {
        setSaving(false)
        setError(uploadError.message)
        return
      }

      const { data } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName)

      finalImage = data.publicUrl
    }

    // ✅ Call server API
    const res = await fetch('/api/admin/banners/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: bannerId,
        title,
        text,
        cta_label: ctaLabel,
        cta_href: ctaHref,
        img: finalImage,
        sort_order: sortOrder,
        is_active: isActive,
      }),
    })

    const result = await res.json()
    setSaving(false)

    if (!res.ok) {
      setError(result.error || 'Update failed')
      return
    }

    router.push('/admin/banners')
  }

  if (loading) return <p>Loading banner…</p>

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Edit Banner</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Description"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <p>Current Image</p>
      <img src={imageUrl} style={{ maxWidth: '100%', marginBottom: 10 }} />

      <input
        type="file"
        accept="image/*"
        onChange={e => setNewImage(e.target.files?.[0] ?? null)}
        style={{ marginBottom: 10 }}
      />

      <input
        value={ctaLabel}
        onChange={e => setCtaLabel(e.target.value)}
        placeholder="Button Label"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        value={ctaHref}
        onChange={e => setCtaHref(e.target.value)}
        placeholder="Button Link"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        type="number"
        value={sortOrder}
        onChange={e => setSortOrder(Number(e.target.value))}
        placeholder="Sort Order"
        style={{ width: '100%', marginBottom: 10 }}
      />

      <label>
        <input
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
        />{' '}
        Active
      </label>

      <br /><br />

      <button onClick={saveBanner} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </main>
  )
}
