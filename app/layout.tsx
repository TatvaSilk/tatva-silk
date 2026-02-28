// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tatva Silk & Shubh Vivah',
  description: 'Fast shipping on beautiful silk sarees — curated selections.',
  metadataBase: new URL('https://tatva-silk.vercel.app'), // update if you have a custom domain
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
