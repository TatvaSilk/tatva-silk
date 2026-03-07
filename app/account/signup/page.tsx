'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function SignupPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSignup(e: any) {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        },
        emailRedirectTo:
          typeof window !== 'undefined'
            ? window.location.origin + '/account'
            : undefined,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Verification email sent! Please check your inbox.')
    }

    setLoading(false)
  }

  function update(key: string, value: string) {
    setForm({ ...form, [key]: value })
  }

  return (
    <main style={{ padding: '40px', maxWidth: 500, margin: '0 auto' }}>
      <h1>Create Account</h1>
      <form onSubmit={handleSignup} style={{ display: 'grid', gap: 12, marginTop: 20 }}>
        <input placeholder="Email" type="email" required
          value={form.email} onChange={(e) => update('email', e.target.value)} />

        <input placeholder="Password" type="password" required
          value={form.password} onChange={(e) => update('password', e.target.value)} />

        <input placeholder="Full Name"
          value={form.name} onChange={(e) => update('name', e.target.value)} />

        <input placeholder="Phone"
          value={form.phone} onChange={(e) => update('phone', e.target.value)} />

        <input placeholder="Address"
          value={form.address} onChange={(e) => update('address', e.target.value)} />

        <input placeholder="City"
          value={form.city} onChange={(e) => update('city', e.target.value)} />

        <input placeholder="Pincode"
          value={form.pincode} onChange={(e) => update('pincode', e.target.value)} />

        <button type="submit" disabled={loading}
          style={{ background: 'black', color: 'white', padding: 10 }}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  )
}
