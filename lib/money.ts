// lib/money.ts
export function formatINR(n?: number | null) {
  if (typeof n !== 'number') return '₹0.00'
  return `₹${(n / 100).toFixed(2)}`
}
