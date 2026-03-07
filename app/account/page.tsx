// app/account/page.tsx
import { createClient } from '@supabase/supabase-js'
import AccountPanel from '@/components/AccountPanel'

export const revalidate = 0 // always show fresh auth state

export default async function AccountPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // (Optional) server-side read of user to redirect if needed later
  // For now, we’ll just render the client panel that handles auth flows.

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Account</h1>
      <AccountPanel supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnon} />
    </main>
  )
}
