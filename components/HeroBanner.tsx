'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Slide = {
  id: string
  title: string
  text: string
  cta_label: string
  cta_href: string
  img: string
  mobile_img?: string
  gradient_color?: string
  theme?: 'dark' | 'light'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function HeroBanner() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [idx, setIdx] = useState(0)
  const timer = useRef<NodeJS.Timeout | null>(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const total = slides.length

  useEffect(() => {
    supabase
      .from('home_banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => setSlides(data ?? []))
  }, [])

  useEffect(() => {
    if (total > 1) {
      timer.current = setInterval(() => setIdx(i => (i + 1) % total), 4500)
    }
    return () => timer.current && clearInterval(timer.current)
  }, [total])

  if (!slides.length) return null

  const s = slides[idx]
  const imageToUse = isMobile && s.mobile_img ? s.mobile_img : s.img
  const dark = s.theme !== 'light'

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto' }}>
      <div
        style={{
          position: 'relative',
          height: 380,
          borderRadius: 14,
          overflow: 'hidden',
          background: s.gradient_color || '#0b1220',
        }}
      >
        <Image
          src={imageToUse}
          alt={s.title}
          fill
          sizes="100vw"
          style={{
            objectFit: 'contain',
            opacity: dark ? 0.9 : 1,
          }}
          priority
        />

        {/* GRADIENT */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg,
              ${s.gradient_color || '#0b1220'}dd 0%,
              ${s.gradient_color || '#0b1220'}88 40%,
              transparent 75%)`,
          }}
        />

        {/* TEXT */}
        <div
          style={{
            position: 'absolute',
            left: 32,
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: 480,
            color: dark ? '#f8fafc' : '#111827',
          }}
        >
          <h2>{s.title}</h2>
          <p style={{ margin: '12px 0' }}>{s.text}</p>
          <Link href={s.cta_href}>
            <button
              style={{
                background: '#f59e0b',
                border: 'none',
                padding: '12px 20px',
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              {s.cta_label}
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
``
