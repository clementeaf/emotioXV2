'use client';

import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const researchId = searchParams ? searchParams.get('research') : '';

  return (
    <div className="flex h-screen">
      <div className="w-60 mt-10 mx-5">
        {researchId ? (
          <ResearchSidebar researchId={researchId} />
        ) : (
          <Sidebar />
        )}
      </div>
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
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
