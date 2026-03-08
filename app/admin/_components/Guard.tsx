'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '../../../lib/supabaseClient';

export default function Guard({
  // We'll keep allowed for later when roles are fully set;
  // for now we still check role but via Authorization header
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
        // 1) Get the current session on the client
        const supabase = supabaseBrowser();
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          router.replace('/login');
          return;
        }

        // 2) Call /api/auth/me WITH the Bearer token
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: 'no-store'
        });

        if (res.status === 401) {
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          // If authenticated but not allowed, go home
          router.replace('/');
          return;
        }

        const me = await res.json();

        // Role check (keep this)
        if (!allowed.includes(me.role)) {
          router.replace('/');
          return;
        }

        if (!cancelled) {
          setOk(true);
          setChecking(false);
        }
      } catch {
        router.replace('/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, allowed]);

  if (checking) return <div style={{ padding: 20, opacity: 0.7 }}>Checking access…</div>;
  if (!ok) return null;
  return <>{children}</>;
}
