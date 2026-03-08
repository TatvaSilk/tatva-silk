export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * We authenticate using the Bearer token forwarded from the client.
 * This avoids relying on cookies and works reliably with App Router.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const hasBearer = authHeader.toLowerCase().startsWith('bearer ');
  const token = hasBearer ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  // 1) Identify the user from the token
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // 2) Ensure a profile row exists (first call can create it)
  let profileEmail = user.email ?? null;
  let role: 'admin' | 'manager' | 'customer' = 'customer';
  let approved = false;

  // Try to read profile
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('email, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  if (!pErr && profile) {
    profileEmail = profile.email ?? profileEmail;
    role = (profile.role as any) ?? role;
    approved = (profile.approved as any) ?? approved;
  } else {
    // Attempt to create a minimal profile row if not found
    const { data: inserted } = await supabase
      .from('profiles')
      .insert({ id: user.id, email: profileEmail })
      .select('email, role, approved')
      .single()
      .catch(() => ({ data: null as any })); // ignore RLS insert failures silently

    if (inserted) {
      profileEmail = inserted.email ?? profileEmail;
      role = (inserted.role as any) ?? role;
      approved = (inserted.approved as any) ?? approved;
    }
  }

  // Optional: legacy fallback if you still have admin_users table
  if (role === 'customer') {
    const { data: admin } = await supabase
      .from('admin_users')
      .select('role, email')
      .eq('email', profileEmail)
      .maybeSingle()
      .catch(() => ({ data: null as any }));
    if (admin?.role === 'admin' || admin?.role === 'manager') {
      role = admin.role as any;
      approved = true;
    }
  }

  return NextResponse.json({
    userId: user.id,
    email: profileEmail,
    role,
    approved
  });
}
