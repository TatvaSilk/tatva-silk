export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

export default async function AdminOrdersPage() {
  try {
    // ✅ 1. Check env vars explicitly
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return <pre>ERROR: NEXT_PUBLIC_SUPABASE_URL missing</pre>
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return <pre>ERROR: SUPABASE_SERVICE_ROLE_KEY missing</pre>
    }

    // ✅ 2. Create client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // ✅ 3. Test simple query
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_no')
      .limit(1)

    if (error) {
      return <pre>SUPABASE ERROR: {JSON.stringify(error, null, 2)}</pre>
    }

    return (
      <div style={{ padding: 40 }}>
        <h1>Admin Orders – Debug OK ✅</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    )
  } catch (e: any) {
    return (
      <pre>
        FATAL ERROR:
        {JSON.stringify(
          {
            message: e?.message,
            stack: e?.stack,
          },
          null,
          2
        )}
      </pre>
    )
  }
}
