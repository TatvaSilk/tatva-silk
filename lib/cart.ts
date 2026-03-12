// lib/cart.ts
export type CartLine = { productId: string; qty: number };

const KEY = 'cart';
export const CART_EVENT = 'cart:changed';
export const CART_OPEN_EVENT = 'cart:open';

function read(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY) || '[]';
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.productId === 'string' && Number.isFinite(x.qty))
      .map((x) => ({ productId: x.productId, qty: Math.max(1, Number(x.qty) || 1) }));
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  broadcast();
}

export function broadcast() {
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function getCart(): CartLine[] {
  return read();
}

export function getCount(): number {
  return read().reduce((s, l) => s + l.qty, 0);
}

export function add(productId: string, qty = 1) {
  const lines = read();
  const i = lines.findIndex((l) => l.productId === productId);
  if (i >= 0) lines[i].qty += qty;
  else lines.push({ productId, qty });
  write(lines);
}

export function setQty(productId: string, qty: number) {
  const lines = read();
  const i = lines.findIndex((l) => l.productId === productId);
  if (i >= 0) {
    if (qty <= 0) lines.splice(i, 1);
    else lines[i].qty = qty;
    write(lines);
  }
}

export function remove(productId: string) {
  const lines = read().filter((l) => l.productId !== productId);
  write(lines);
}

export function clear() {
  write([]);
}

export function openDrawer() {
  window.dispatchEvent(new CustomEvent(CART_OPEN_EVENT));
}
