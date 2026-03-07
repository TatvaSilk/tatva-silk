'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default function LoginPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function login(e: any) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email, password
    })

    if (error) setMsg(error.message)
    else window.location.href = '/account'

    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={login} style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <input placeholder="Email" type="email"
          value={email} onChange={(e) => setEmail(e.target.value)} />

        <input placeholder="Password" type="password"
          value={password} onChange={(e) => setPassword(e.target.value)} />

        <button disabled={loading}
          style={{ background: 'black', color: 'white', padding: 10 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Don't have an account? <Link href="/account/signup">Create one</Link>
      </p>

      {msg && <p style={{ marginTop: 16, color: 'red' }}>{msg}</p>}
    </div>
  )
}
