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
    <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
      <ErrorBoundary>
        <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
          <ResearchListWithSuspense />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
