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

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    // If Confirm Email is ON, Supabase returns an error until the user confirms.
    if (error) setMsg(error.message)  // we can refine messaging below
    else window.location.href = '/account'
    setLoading(false)
  }

  async function signInWithGoogle() {
    setMsg(null)
    const redirectTo =
      typeof window !== 'undefined' ? window.location.origin + '/account' : undefined
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
    if (error) setMsg(error.message)
  }

  return (
    <div>
      <form onSubmit={login} style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading} style={{ background: 'black', color: 'white', padding: 10 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Friendly error for unverified email */}
      {msg && (
        <p style={{ marginTop: 12, color: 'crimson' }}>
          {msg.includes('confirm') ? 'Please verify your email. Check your inbox.' : msg}
        </p>
      )}

      <p style={{ marginTop: 12 }}>
        /account/forgotForgot password?</Link>
      </p>
      <p style={{ marginTop: 8 }}>
        Don&apos;t have an account? /account/signupCreate one</Link>
      </p>

      <div style={{ margin: '20px 0', color: '#aaa' }}>— or —</div>

      <button
        onClick={signInWithGoogle}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #ddd', padding: '10px 14px', borderRadius: 6 }}
      >
        <svg width="18" height="18" viewBox="0 0 533.5 544.3" aria-hidden>
          <path fill="#4285F4" d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.4H272v95.5h147.1c-6.4 34.6-25.8 63.9-55 83.5v69h88.9c52.1-48 80.5-118.6 80.5-197.6z"/>
          <path fill="#34A853" d="M272 544.3c72.8 0 134-24.1 178.6-65.4l-88.9-69c-24.7 16.6-56.3 26.4-89.7 26.4-68.9 0-127.3-46.5-148.1-109.1H33.3v68.5C78.5 487 170.9 544.3 272 544.3z"/>
          <path fill="#FBBC05" d="M123.9 327.2c-10.1-29.9-10.1-62.1 0-92l.1-68.6H33.3c-39.1 78.1-39.1 170.9 0 249l90.6-68.4z"/>
          <path fill="#EA4335" d="M272 107.7c37.4-.6 73.4 13.2 101 39.2l75.4-75.4C406 14 343 0 272 0 170.9 0 78.5 57.3 33.3 176.6l90.6 68.6C144.7 154.2 203.1 107.7 272 107.7z"/>
        </svg>
        Continue with Google
      </button>
    </div>
  )
}
