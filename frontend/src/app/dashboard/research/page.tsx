'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import ResearchList from '@/components/dashboard/ResearchList';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { memo, Suspense } from 'react';

const ResearchListContent = memo(() => {
  return <ResearchList />;
});
ResearchListContent.displayName = 'ResearchListContent';
const ResearchListWithSuspense = withSearchParams(ResearchListContent);

export default function ResearchPage() {
  const { token } = useProtectedRoute();
  if (!token) {
    return null;
  }
  return (
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] flex flex-col justify-start">
      <div className="mx-auto px-6 py-8 w-full">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <ResearchListWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
