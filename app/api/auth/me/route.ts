import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function GET() {
  const supabase = supabaseServer();

  // 1) Get signed-in user from Supabase session
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  // Default role
  let role: 'admin' | 'manager' | 'customer' = 'customer';
  let approved = false;
  let email = user.email ?? '';

  // 2) If you already have a unified 'profiles' table, use it
  const { data: profile } = await supabase
    .from('profiles')               // safe try: if it doesn't exist, the query will error; we'll ignore
    .select('email, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    email = profile.email ?? email;
    role = (profile.role as any) ?? role;
    approved = (profile.approved as any) ?? approved;
  } else {
    // 3) Fallback: check your existing 'admin_users' by email
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    if (admin?.role === 'admin' || admin?.role === 'manager') {
      role = admin.role as any;
      approved = true;
    } else {
      // 4) Last fallback: customer_profiles (if you want to treat them as approved customers)
      const { data: customer } = await supabase
        .from('customer_profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (customer) {
        approved = true;
      }
    }
  }

  return NextResponse.json({
    userId: user.id,
    email,
    role,
    approved
  });
}
