'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
import { ResearchHistoryContent } from '@/components/research-history/ResearchHistoryContent';
import { Spinner } from '@/components/ui/Spinner';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Suspense } from 'react';

const ResearchHistoryContentWithParams = withSearchParams(ResearchHistoryContent);

export default function ResearchHistoryPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <ErrorBoundary>
            <Suspense fallback={<Spinner message="Cargando datos del historial..." />}>
              <ResearchHistoryContentWithParams />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
