'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function ResetPasswordPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // When the user lands here from the email, Supabase grants a temporary session.
  // We just need to let the page load, then call updateUser({ password }).
  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setReady(true)
      }
    })
    // Even if the event doesn't fire due to timing, allow UI anyway:
    setTimeout(() => setReady(true), 800)
    return () => { sub.data.subscription.unsubscribe() }
  }, [])

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!pw1 || pw1 !== pw2) {
      setMsg('Passwords do not match.')
      return
    }
    const { data, error } = await supabase.auth.updateUser({ password: pw1 })
    if (error) setMsg(error.message)
    else setMsg('Password updated! You can now sign in.')
  }

  return (
    <main style={{ padding: '40px', maxWidth: 460, margin: '0 auto' }}>
      <h1>Set new password</h1>
      <form onSubmit={changePassword} style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <input type="password" placeholder="New password" value={pw1} onChange={(e) => setPw1(e.target.value)} />
        <input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <button disabled={!ready} style={{ background: '#000', color: '#fff', padding: 10, borderRadius: 6 }}>
          Update password
        </button>
      </form>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  )
}
