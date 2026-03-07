'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Props = {
  supabaseUrl: string
  supabaseAnonKey: string
}

export default function AccountPanel({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } })

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    // Load current user
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
      setLoadingUser(false)
    })
    // Listen to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!email) return
    setSending(true)
    try {
      // Magic link to the provided email (uses SITE_URL configured in Supabase)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/account' : undefined },
      })
      if (error) throw error
      setMessage('Check your email for a sign‑in link.')
    } catch (err: any) {
      setMessage(err?.message ?? 'Failed to send sign‑in link')
    } finally {
      setSending(false)
    }
  }

  async function signOut() {
    setMessage(null)
    await supabase.auth.signOut()
  }

  if (loadingUser) {
    return <div>Loading…</div>
  }

  if (!userEmail) {
    // Logged out view
    return (
      <div style={{ maxWidth: 420 }}>
        <h2>Sign in / Create account</h2>
        <p style={{ color: '#555', marginBottom: 12 }}>Enter your email to receive a sign‑in link.</p>
        <form onSubmit={signInWithEmail} style={{ display: 'grid', gap: 8 }}>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px' }}
          />
          <button
            type="submit"
            disabled={sending || !email}
            style={{
              background: '#000',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 6,
              opacity: sending ? 0.6 : 1
            }}
          >
            {sending ? 'Sending…' : 'Send sign‑in link'}
          </button>
        </form>
        {message && <div style={{ marginTop: 12, color: '#2563eb' }}>{message}</div>}
      </div>
    )
  }

  // Logged in view
  return (
    <div style={{ maxWidth: 520 }}>
      <h2>My Account</h2>
      <div style={{ marginTop: 8, color: '#444' }}>Signed in as <b>{userEmail}</b></div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <a href="/orders" style={{ color: '#2563eb' }}>View Orders →</a>
        <button
          onClick={signOut}
          style={{ background: '#eee', border: '1px solid #ddd', padding: '8px 12px', borderRadius: 6 }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
