import { NextResponse } from 'next/server';
import { supabaseServer } from '../../../../lib/supabaseServer';

export async function GET() {
  const supabase = supabaseServer();

  // Get signed-in user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let role: 'admin' | 'manager' | 'customer' = 'customer';
  let approved = false;
  let email = user.email ?? '';

  // Try a unified profiles table first (if you create it later)
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role, approved')
    .eq('id', user.id)
    .maybeSingle();

  if (profile) {
    email = profile.email ?? email;
    role = (profile.role as any) ?? role;
    approved = (profile.approved as any) ?? approved;
  } else {
    // Fallback: use your existing admin_users
    const { data: admin } = await supabase
      .from('admin_users')
      .select('email, role')
      .eq('email', email)
      .maybeSingle();

    if (admin?.role === 'admin' || admin?.role === 'manager') {
      role = admin.role as any;
      approved = true;
    } else {
      // Optional: if you want to treat existing customer_profiles as approved customers:
      const { data: customer } = await supabase
        .from('customer_profiles')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      if (customer) approved = true;
    }
  }

  return NextResponse.json({
    userId: user.id,
    email,
    role,
    approved
  });
}
