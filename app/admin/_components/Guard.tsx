'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

export default function Guard({
  allowed,
  children,
}: {
  allowed: string[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !allowed.includes(profile.role)) {
        router.push('/'); // ✅ redirect instead of 404
        return;
      }

      setLoading(false);
    }

    check();
  }, [allowed, router, supabase]);

  if (loading) {
    return <div style={{ padding: 40 }}>Checking permissions…</div>;
  }

  return <>{children}</>;
}
