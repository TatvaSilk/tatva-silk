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
      // Try the RPC to get or create active cart so we always have a cart_id
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCount(0); return }

      const { data: cartId, error: fnErr } = await supabase.rpc('ensure_active_cart')
      if (fnErr || !cartId) { setCount(0); return }

      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cartId as string)

      const c = (data ?? []).reduce((s, r: any) => s + (r.quantity ?? 0), 0)
      setCount(c)

      // Subscribe once we know the cart id
      if (!channel) {
        channel = supabase
          .channel('cart_items_count')
          .on(
            'postgres_changes',
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
