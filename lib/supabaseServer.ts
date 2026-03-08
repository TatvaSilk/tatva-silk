// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export function supabaseServer() {
  const cookieStore = cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // This hooks Next.js cookies into Supabase SSR auth.
        storage: {
          getItem: (key) => cookieStore.get(key)?.value ?? null,
          setItem: () => {}, // read-only here; Supabase sets via headers
          removeItem: () => {}
        },
        persistSession: true,
        autoRefreshToken: true
      }
    }
  );
}
