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
    <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
      <ErrorBoundary>
        <Suspense fallback={<Spinner message="Cargando datos del historial..." />}>
          <ResearchHistoryContentWithParams />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
