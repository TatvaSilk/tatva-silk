'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export default function Guard({
  allowed,
  children,
}: {
  allowed: string[]
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAccess() {
      // 1️⃣ Get logged-in user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/account')
        return
      }

      // 2️⃣ Fetch role from customer_profiles
      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // 3️⃣ Check role
      if (error || !profile || !allowed.includes(profile.role)) {
        router.push('/') // not authorized
        return
      }

      setLoading(false)
    }

    checkAccess()
  }, [allowed, router, supabase])

  if (loading) {
    return <div style={{ padding: 40 }}>Checking permissions…</div>
  }

  return <>{children}</>
}
