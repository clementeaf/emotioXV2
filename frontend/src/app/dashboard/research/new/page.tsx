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
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] flex flex-col justify-start overflow-y-auto">
      <div className="mx-auto px-6 py-8 w-full">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <NewResearchContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
