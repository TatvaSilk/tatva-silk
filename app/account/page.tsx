// app/account/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import LoginPanel from '@/components/LoginPanel'

export default function AccountPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // ✅ Already logged in → go to home
        window.location.replace('/')
      } else {
        // ❌ Not logged in → allow login page
        setChecking(false)
      }
    })
  }, [])

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: 'center' }}>
        Checking account…
      </main>
    )
  }

  return (
    <main style={{ padding: '40px', maxWidth: 500, margin: '0 auto' }}>
      <h1>Account</h1>
      <LoginPanel />
    </main>
  )
}
