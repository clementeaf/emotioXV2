'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { NewResearchContent } from '@/components/research/NewResearchContent';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Suspense } from 'react';

/**
 * Página de creación de nueva investigación
 */
const NewResearchContentWithSuspense = withSearchParams(NewResearchContent);

export default function NewResearchPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
      <ErrorBoundary>
        <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
          <NewResearchContentWithSuspense />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
