'use client';

import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const researchId = searchParams ? searchParams.get('research') : '';
  const hasSection = searchParams ? Boolean(searchParams.get('section')) : false;


  return (
    <div className="flex h-screen p-6 gap-6" style={{ backgroundColor: '#f1f5f9' }}>
      <div className="w-60 bg-white rounded-xl">
        {researchId ? (
          <ResearchSidebar researchId={researchId} />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className={hasSection ? 'flex-1 bg-white rounded-lg border border-neutral-200' : 'flex-1 bg-white rounded-lg shadow-lg'}>
        <main className="h-full p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Cargando dashboard...</span>
        </div>
      </div>
    }>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
