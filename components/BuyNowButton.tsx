'use client'

type Props = {
  productId: string
}

export default function BuyNowButton({ productId }: Props) {
  return (
    <button
      style={{
        background: '#f59e0b',
        color: '#111827',
        padding: '8px 12px',
        borderRadius: 8,
        fontWeight: 700,
        border: 'none',
        cursor: 'pointer',
      }}
      onClick={() => {
        // ✅ Replace cart with single product
        localStorage.setItem(
          'cart',
          JSON.stringify([{ productId, qty: 1 }])
        )

        // ✅ Redirect to checkout
        window.location.href = '/checkout'
      }}
    >
      Buy Now
    </button>
  )
}
