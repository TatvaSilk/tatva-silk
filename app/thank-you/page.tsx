import { Suspense } from 'react'
import ThankYouClient from './thank-you-client'

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading…</div>}>
      <ThankYouClient />
    </Suspense>
  )
}
