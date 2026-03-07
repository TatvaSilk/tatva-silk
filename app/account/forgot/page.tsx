'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ForgotPasswordPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function sendReset(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null); setSending(true)
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin + '/account/reset' : undefined

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    // Step 1: send email with reset link; Step 2 happens on /account/reset with updateUser()
    // (This is the official 2‑step reset flow)
    if (error) setMsg(error.message)
    else setMsg('Password reset link sent. Please check your email.')
    setSending(false)
  }

  return (
    <main style={{ padding: '40px', maxWidth: 460, margin: '0 auto' }}>
      <h1>Forgot password</h1>
      <form onSubmit={sendReset} style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px' }}
        />
        <button disabled={sending || !email} style={{ background: '#000', color: '#fff', padding: 10, borderRadius: 6 }}>
          {sending ? 'Sending…' : 'Send reset email'}
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  )
}
