'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
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
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] flex flex-col justify-start">
      <div className="mx-auto px-6 py-8 w-full">
        <ErrorBoundary>
          <Suspense fallback={<Spinner message="Cargando datos del historial..." />}>
            <ResearchHistoryContentWithParams />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
