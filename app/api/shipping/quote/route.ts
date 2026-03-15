// app/api/shipping/quote/route.ts
import { NextResponse } from 'next/server';
import { getShippingQuote, cartSubtotal } from '@/lib/shipping';

export async function POST(req: Request) {
  try {
    const { cart, address } = await req.json();
    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }
    const subtotal = cartSubtotal(cart);
    const quote = getShippingQuote(cart, address || {}, subtotal);
    return NextResponse.json({ subtotal, quote, total: subtotal + quote.amount }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to quote shipping' }, { status: 400 });
  }
}
