// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Read public env vars (anon key is safe to expose; it's designed for client use).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Provide a clear error if env vars are missing (helps during Vercel builds).
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel Project Settings → Environment Variables.'
  )
}

/**
 * Singleton Supabase client.
 * For server components and simple public reads, we disable session persistence.
 * Do NOT include service role keys here.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})
