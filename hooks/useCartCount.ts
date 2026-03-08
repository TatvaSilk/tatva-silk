'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

export function useCartCount() {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    let channel: any

    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCount(0); return }

      // Try RPC; if missing, fallback by selecting cart
      let cartId: string | null = null
      const { data: rpcId } = await supabase.rpc('ensure_active_cart')
      if (rpcId) {
        cartId = rpcId as string
      } else {
        const { data: c1 } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', user.id)   // using customer_id
          .limit(1)
          .maybeSingle()
        if (c1?.id) cartId = c1.id
      }

      if (!cartId) { setCount(0); return }

      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cartId)

      const c = (data ?? []).reduce((s, r: any) => s + (r.quantity ?? 0), 0)
      setCount(c)

      if (!channel) {
        channel = supabase
          .channel('cart_items_count')
          .on('postgres_changes',
              { event: '*', schema: 'public', table: 'cart_items', filter: `cart_id=eq.${cartId}` },
              () => refresh()
          )
          .subscribe()
      }
    }

    refresh()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  return count
}
