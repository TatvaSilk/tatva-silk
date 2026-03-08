'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabaseClient';

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
      router.replace('/login');
    })();
  }, [router]);
  return <main style={{ padding: 20 }}>Signing out…</main>;
}
