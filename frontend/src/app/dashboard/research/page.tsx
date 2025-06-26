'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { memo, Suspense } from 'react';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import ResearchList from '@/components/dashboard/ResearchList';
import { AppShellLayout } from '@/components/layout/AppShellLayout';
import { ResearchSidebar } from '@/components/layout/ResearchSidebar';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Componente interno memoizado
const ResearchListContent = memo(() => {
  return <ResearchList />;
});

ResearchListContent.displayName = 'ResearchListContent';

// Componente interno que usa useSearchParams
const ResearchPageWithParams = memo(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research') || '';

  return (
    <AppShellLayout sidebar={<ResearchSidebar researchId={researchId} />}>
      <div className="liquid-glass flex-1 overflow-y-auto mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] flex flex-col justify-start">
        <div className="mx-auto px-6 py-8 w-full">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">Mis Investigaciones</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Administra y consulta todas tus investigaciones
            </p>
          </div>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <ResearchListWithSuspense />
          </Suspense>
        </div>
      </div>
    </AppShellLayout>
  );
});

ResearchPageWithParams.displayName = 'ResearchPageWithParams';

// Envolver con el HOC
const ResearchListWithSuspense = withSearchParams(ResearchListContent);

export default function ResearchPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
        <ResearchPageWithParams />
      </Suspense>
    </ErrorBoundary>
  );
}
