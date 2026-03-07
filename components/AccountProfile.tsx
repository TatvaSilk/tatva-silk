'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Profile = {
  email: string | null
  name: string | null
  phone: string | null
  address: string | null
  city: string | null
  pincode: string | null
}

export default function AccountProfile() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [info, setInfo] = useState<Profile | null>(null)
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setEmailVerified(!!user.email_confirmed_at)
      const { data } = await supabase
        .from('profiles')
        .select('email,name,phone,address,city,pincode')
        .eq('id', user.id)
        .maybeSingle()
      setInfo(data as any)
      setLoading(false)
    })()
  }, [])

  if (loading) return <div>Loading profile…</div>
  if (!info) return <div>Not signed in.</div>

  return (
    <div style={{ marginTop: 24 }}>
      <h2>My Profile</h2>
      <div style={{ color: emailVerified ? 'green' : 'crimson', marginBottom: 8 }}>
        {emailVerified ? 'Email verified' : 'Email not verified'}
      </div>
      <div><b>Email:</b> {info.email ?? '—'}</div>
      <div><b>Name:</b> {info.name ?? '—'}</div>
      <div><b>Phone:</b> {info.phone ?? '—'}</div>
      <div><b>Address:</b> {info.address ?? '—'}</div>
      <div><b>City:</b> {info.city ?? '—'}</div>
      <div><b>Pincode:</b> {info.pincode ?? '—'}</div>
    </div>
  )
}
