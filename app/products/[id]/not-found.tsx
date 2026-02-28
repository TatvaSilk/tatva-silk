// app/products/[id]/not-found.tsx
export default function NotFound() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <a href="/products" style={{ color: '#2563eb' }}>← Back to products</a>
      <h1 style={{ marginTop: 12 }}>Product not found</h1>
      <p style={{ color: '#666' }}>
        The product you are looking for does not exist or may have been removed.
      </p>
    </main>
  )
}
