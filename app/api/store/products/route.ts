export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

/**
 * Public products API used by the storefront (no auth).
 *
 * Query params:
 *   ?category=slug   -> filter by subcategory slug (e.g., banarasi)
 *   ?q=term          -> case-insensitive name contains
 *   ?limit=24        -> default 24 (max 100)
 *   ?offset=0        -> pagination offset
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const slug = (url.searchParams.get('category') ?? '').trim();
    const q = (url.searchParams.get('q') ?? '').trim();
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '24'), 100);
    const offset = Math.max(Number(url.searchParams.get('offset') ?? '0'), 0);

    const admin = supabaseAdmin();

    // Resolve subcategory id (child) from slug if provided
    let categoryId: string | null = null;
    if (slug) {
      const { data: cat, error: catErr } = await admin
        .from('categories')
        .select('id, slug, parent_id')
        .eq('slug', slug)
        .maybeSingle();
      if (catErr) return NextResponse.json({ error: catErr.message }, { status: 500 });
      // only allow child categories (require parent_id != null)
      if (cat?.id && cat.parent_id) categoryId = cat.id;
    }

    let qProducts = admin
      .from('products')
      .select('id, name, original_price, offer_price, stock, category_id, created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (categoryId) qProducts = qProducts.eq('category_id', categoryId);
    if (q) qProducts = qProducts.ilike('name', `%${q}%`);

    const { data: products, error: pErr } = await qProducts;
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!products?.length) return NextResponse.json({ items: [], total: 0 });

    // first image for each product
    const ids = products.map(p => p.id);
    const { data: imgs, error: iErr } = await admin
      .from('product_images')
      .select('product_id, url, sort_order')
      .in('product_id', ids)
      .order('sort_order', { ascending: true });
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });

    const first = new Map<string, string | null>();
    for (const id of ids) first.set(id, null);
    for (const row of imgs ?? []) {
      if (!first.get(row.product_id as string)) first.set(row.product_id as string, row.url as string);
    }

    // resolve category label
    const catIds = Array.from(new Set(products.map(p => p.category_id).filter(Boolean))) as string[];
    const labels = new Map<string, string>();
    if (catIds.length) {
      const { data: cats, error: cErr } = await admin
        .from('categories')
        .select('id, label')
        .in('id', catIds);
      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });
      for (const c of cats ?? []) labels.set(c.id, c.label);
    }

    const items = products.map(p => ({
      ...p,
      category_label: p.category_id ? (labels.get(p.category_id) ?? null) : null,
      primary_image_url: first.get(p.id) ?? null
    }));

    // Optionally return a real count with an extra count query if you need pagination UI
    return NextResponse.json({ items, total: items.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'failed' }, { status: 500 });
  }
}
