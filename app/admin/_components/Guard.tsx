'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../lib/supabaseClient';

export default function Guard({
  allowed = ['admin', 'manager'],
  children
}: {
  allowed?: string[];
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Get token from Supabase client
        const supabase = supabaseBrowser();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) { router.replace('/login'); return; }

        // Ask server who I am (with Bearer token)
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });

        if (res.status === 401) { router.replace('/login'); return; }
        if (!res.ok) { router.replace('/'); return; }

        const me = await res.json();

        // Require role AND approved = true
        if (!allowed.includes(me.role) || me.approved !== true) {
          router.replace('/'); // signed in but not allowed/approved
          return;
        }

        if (!cancelled) { setOk(true); setChecking(false); }
      } catch {
        router.replace('/login');
      }
    })();

    return () => { cancelled = true; };
  }, [router, allowed]);

  if (checking) return <div style={{ padding: 20, opacity: 0.7 }}>Checking access…</div>;
  if (!ok) return null;
  return <>{children}</>;
}
