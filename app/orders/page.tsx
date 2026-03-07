// app/orders/page.tsx
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function OrdersPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 12 }}>
        /account← Back to Account</Link>
      </div>

      <h1>Orders</h1>
      {!user ? (
        <p style={{ marginTop: 12 }}>
          You need to be signed in to see orders. /accountGo to Account</Link>
        </p>
      ) : (
        <p style={{ color: '#666', marginTop: 12 }}>
          Orders list will appear here (we can connect to a Supabase `orders` table next).
        </p>
      )}
    </main>
  )
}
