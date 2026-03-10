import type { Metadata } from 'next';
import PublicCategoriesNav from '@/components/PublicCategoriesNav';

export const metadata: Metadata = { title: 'Tatva Silk' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Top header: logo / search / account / cart ... */}

        {/* Category bar */}
        <div style={{ background:'#111827', color:'#e2e8f0', borderTop:'1px solid #1f2937', borderBottom:'1px solid #1f2937' }}>
          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '8px 16px' }}>
            {/* show children under the first parent (e.g., Sarees) */}
            <PublicCategoriesNav parentSlug="sarees" limit={10} />
            {/*
              or, showAllChildren to render every child from all parents:
              <PublicCategoriesNav showAllChildren limit={12} />
            */}
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
