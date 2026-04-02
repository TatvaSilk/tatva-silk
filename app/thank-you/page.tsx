import { Suspense } from 'react'
import ThankYouClient from './thank-you-client'

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouFallback />}>
      <ThankYouClient />
    </Suspense>
  )
}

function ThankYouFallback() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '80px 24px',
        textAlign: 'center',
      }}
    >
      <h1>Processing your order…</h1>
      <p>Please wait a moment.</p>
    </main>
  )
}
