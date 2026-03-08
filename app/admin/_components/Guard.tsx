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
    let done = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const me = await res.json();
        if (!allowed.includes(me.role)) {
          router.replace('/');
          return;
        }
        if (!done) {
          setOk(true);
          setChecking(false);
        }
      } catch {
        router.replace('/login');
      }
    })();
    return () => {
      done = true;
    };
  }, [router, allowed]);

  if (checking) return <div style={{ padding: 20, opacity: 0.7 }}>Checking access…</div>;
  if (!ok) return null;
  return <>{children}</>;
}
