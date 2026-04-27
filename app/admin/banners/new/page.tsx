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

  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [ctaLabel, setCtaLabel] = useState('')
  const [ctaHref, setCtaHref] = useState('')
  const [sortOrder, setSortOrder] = useState(1)
  const [isActive, setIsActive] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveBanner() {
    setError(null)

    if (!title || !imageFile) {
      setError('Title and Image are required')
      return
    }

    setSaving(true)

    // ✅ 1. Upload image to Supabase Storage
    const fileName = `banner-${Date.now()}-${imageFile.name}`

    const { error: uploadError } = await supabase.storage
      .from('banners')
      .upload(fileName, imageFile)

    if (uploadError) {
      setSaving(false)
      setError(uploadError.message)
      return
    }

    const { data } = supabase.storage
      .from('banners')
      .getPublicUrl(fileName)

    const imageUrl = data.publicUrl

    // ✅ 2. CALL SERVER API (NO DIRECT INSERT HERE)
    const res = await fetch('/api/admin/banners/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        text,
        cta_label: ctaLabel,
        cta_href: ctaHref,
        img: imageUrl,
        sort_order: sortOrder,
        is_active: isActive,
      }),
    })

    const result = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(result.error || 'Failed to save banner')
      return
    }

    router.push('/admin/banners')
  }

  return (
    <main style={{ maxWidth: 640 }}>
      <h1>Add New Banner</h1>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <input
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <textarea
        placeholder="Description"
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={e => setImageFile(e.target.files?.[0] ?? null)}
        style={{ marginBottom: 10 }}
      />

      <input
        placeholder="Button Label"
        value={ctaLabel}
        onChange={e => setCtaLabel(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        placeholder="Button Link"
        value={ctaHref}
        onChange={e => setCtaHref(e.target.value)}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <input
        type="number"
        placeholder="Sort order"
        value={sortOrder}
        onChange={e => setSortOrder(Number(e.target.value))}
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
        {saving ? 'Saving…' : 'Save Banner'}
      </button>
    </main>
  )
}
