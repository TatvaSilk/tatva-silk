export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = supabaseAdmin();

    const { data: p, error: pErr } = await admin
      .from('products')
      .select('id, name, description, original_price, offer_price, stock, category_id, created_at')
      .eq('id', params.id)
      .single();
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!p) return NextResponse.json({ error: 'not-found' }, { status: 404 });

    let category: { id: string; slug: string; label: string } | null = null;
    if (p.category_id) {
      const { data: c, error: cErr } = await admin
        .from('categories')
        .select('id, slug, label, parent_id')
        .eq('id', p.category_id)
        .maybeSingle();
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      if (c) category = { id: c.id, slug: c.slug, label: c.label };
    }

    const { data: imgs, error: iErr } = await admin
      .from('product_images')
      .select('url, alt, sort_order')
      .eq('product_id', params.id)
      .order('sort_order', { ascending: true });
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    const primary = imgs?.[0]?.url ?? null;

    return NextResponse.json({
      ...p,
      category,
      images: imgs ?? [],
      primary_image_url: primary
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
