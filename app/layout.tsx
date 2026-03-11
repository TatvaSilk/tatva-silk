// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import HeaderNav from '@/components/HeaderNav'

export const metadata: Metadata = {
  title: {
    default: 'Tatva Silk • Shubh Vivah',
    template: '%s • Tatva Silk',
  },
  description: 'Fast shipping on beautiful silk sarees — curated selections.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tatva-silk.vercel.app'),
  openGraph: {
    title: 'Tatva Silk • Shubh Vivah',
    description: 'Fast shipping on beautiful silk sarees — curated selections.',
    url: '/',
    siteName: 'Tatva Silk',
    type: 'website',
  },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Global header + dynamic category bar appear everywhere */}
        <HeaderNav />
        {children}
      </body>
    </html>
  )
}
