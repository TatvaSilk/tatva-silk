// lib/shipping.ts
export type CartLine = { productId: string; name?: string; price?: number; qty: number; weight?: number; bulky?: boolean };
export type Address = { country?: string; state?: string; city?: string; pincode?: string };
export type ShippingQuote = { label: string; amount: number; currency: 'INR'; meta?: Record<string, any> };

const FREE_THRESHOLD = 4999;      // Free shipping over ₹4,999 (India only)
const FLAT_RATE_IN_INDIA = 99;    // ₹99 flat in India below threshold
const PER_BULKY_ITEM = 50;        // +₹50 per bulky item (optional), India only
const INTERNATIONAL_BASE = 1200;  // ₹1200 base for international shipments
const INTERNATIONAL_PER_KG = 300; // +₹300 per kg (rounded up)

/** Very simple zone check: India vs International */
function inIndia(addr: Address): boolean {
  const c = (addr?.country || 'IN').trim().toUpperCase();
  return c === 'IN' || c === 'INDIA';
}

/** Rough cart weight in kg (fallback if weight missing: 0.5 kg per item) */
function cartWeightKg(lines: CartLine[]): number {
  let total = 0;
  for (const l of lines) {
    const each = l.weight && l.weight > 0 ? l.weight : 0.5;
    total += each * (l.qty || 1);
  }
  return total;
}

/** Compute sub-total in INR from cart lines */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + (l.price || 0) * (l.qty || 0), 0);
}

/** Main shipping calculator */
export function getShippingQuote(lines: CartLine[], addr: Address, subtotal: number): ShippingQuote {
  if (!lines?.length) return { label: 'No items', amount: 0, currency: 'INR' };

  if (inIndia(addr)) {
    // FREE over threshold
    if (subtotal >= FREE_THRESHOLD) {
      return { label: `Free shipping (orders ≥ ₹${FREE_THRESHOLD.toLocaleString('en-IN')})`, amount: 0, currency: 'INR' };
    }
    // Flat rate + bulky add-on
    const bulkyCount = lines.reduce((n, l) => n + ((l.bulky ? 1 : 0) * (l.qty || 0)), 0);
    const bulkyFee = bulkyCount * PER_BULKY_ITEM;
    return { label: 'Standard (India)', amount: FLAT_RATE_IN_INDIA + bulkyFee, currency: 'INR', meta: { bulkyCount } };
  }

  // International: base + per-kg (ceil)
  const kg = Math.ceil(cartWeightKg(lines));
  const amount = INTERNATIONAL_BASE + INTERNATIONAL_PER_KG * Math.max(kg - 1, 0);
  return { label: `International (${kg} kg)`, amount, currency: 'INR', meta: { kg } };
}
