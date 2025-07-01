'use client';

import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname, useSearchParams } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Detectar si estamos en modo investigación por query param
  const researchId = searchParams ? searchParams.get('research') : '';

  return (
    <div className="flex h-screen bg-neutral-50">
      {researchId ? (
        <ResearchSidebar researchId={researchId} />
      ) : (
        <Sidebar />
      )}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
