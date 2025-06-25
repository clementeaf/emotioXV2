'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
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
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <NewResearchContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
