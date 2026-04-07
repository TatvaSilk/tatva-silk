// lib/money.ts
export function formatINR(amountInPaise: number | null | undefined) {
  if (!amountInPaise) return '₹0.00'
  return `₹${(amountInPaise / 100).toFixed(2)}`
}
``
