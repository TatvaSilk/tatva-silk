'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Guard({
  allowed,
  children,
}: {
  allowed: string[]
  children: React.ReactNode
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [status, setStatus] = useState<
    'loading' | 'unauthenticated' | 'unauthorized' | 'ok'
  >('loading')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setStatus('unauthenticated')
        return
      }

      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !allowed.includes(profile.role)) {
        setStatus('unauthorized')
        return
      }

      setStatus('ok')
    }

    check()
  }, [allowed, supabase])

  if (status === 'loading') {
    return <div style={{ padding: 40 }}>Checking access…</div>
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: 40 }}>
        <h2>Admin Login Required</h2>
        <p>Please sign in to access the admin panel.</p>
      </div>
    )
  }

  if (status === 'unauthorized') {
    return (
      <div style={{ padding: 40 }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to access the admin panel.</p>
      </div>
    )
  }

  return <>{children}</>
}
