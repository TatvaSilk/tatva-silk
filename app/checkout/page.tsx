export default function CheckoutStub() {
  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Checkout (Coming Soon)</h1>
      <p style={{ color: '#555' }}>
        This is a placeholder page. Implement your checkout flow here, then set
        <code style={{ marginLeft: 6, background:'#111827', color:'#e5e7eb', padding:'2px 6px', borderRadius:4 }}>
          NEXT_PUBLIC_ENABLE_BUY_NOW=true
        </code>
        to show “Buy Now” on product pages.
      </p>
    </main>
  );
}
