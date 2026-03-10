'use client';

export default function AddToCartLite({ productId, disabled }: { productId: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={() => alert(`Added product ${productId} to cart (demo)`)}
      style={{ background:'#111827', color:'#fff', padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer' }}
    >
      Add to Cart
    </button>
  );
}
