import { Providers } from '@/components/providers';
import { AdminNav } from '@/components/admin-nav';

// Force dynamic rendering for all admin pages
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gray-100">
        {/* Admin Navigation */}
        <AdminNav />

        {/* Main Content */}
        <main className="py-6">
          {children}
        </main>
      </div>
    </Providers>
  );
}
