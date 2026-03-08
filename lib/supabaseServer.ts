// lib/supabaseServer.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function supabaseServer() {
  const cookieStore = cookies();

  // Read-only is enough for /api/auth/me
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (_name: string, _value: string, _options: any) => {
          // no-op here (we're not mutating cookies in this handler)
        },
        remove: (_name: string, _options: any) => {
          // no-op
        }
      }
    }
  );
}
