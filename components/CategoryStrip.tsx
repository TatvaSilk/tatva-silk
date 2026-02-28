// components/CategoryStrip.tsx
import Link from 'next/link'

const cats = [
  { label: 'New Arrivals', href: '/products?tag=new' },
  { label: 'Banarasi', href: '/products?category=banarasi' },
  { label: 'Kanjivam', href: '/products?category=kanjivam' },
  { label: 'Patola', href: '/products?category=patola' },
  { label: 'Soft Silk', href: '/products?category=soft-silk' },
  { label: 'Wedding', href: '/products?category=wedding' },
  { label: 'Gifts', href: '/products?category=gifts' },
  { label: "Today's Deals", href: '/products?tag=deal' },
]

export default function CategoryStrip() {
  return (
    <div className="cat-strip">
      <div className="container">
        <nav className="cat-list">
          {cats.map((c) => (
            <Link key={c.href} href={c.href}>{c.label}</Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
