'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.status === 401) {
          // not signed in
          router.replace('/login');
          return;
        }
        if (!res.ok) {
          // signed in but something else (e.g., no profile yet, forbidden)
          router.replace('/');
          return;
        }
        const me = await res.json();
        if (!allowed.includes(me.role)) {
          router.replace('/'); // signed in but not allowed for admin
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
    return () => { cancelled = true; };
  }, [router, allowed]);

  if (checking) return <div style={{ padding: 20, opacity: 0.7 }}>Checking access…</div>;
  if (!ok) return null;
  return <>{children}</>;
}
