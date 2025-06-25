import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { useSearchParams } from 'next/navigation';
import { memo, Suspense } from 'react';
import { DashboardContent } from './DashboardContent';

/**
 * Layout del dashboard que maneja la estructura condicional
 */
const DashboardLayout = memo(() => {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section');
  const isAimFramework = searchParams?.get('aim') === 'true';

  // Para investigaciones con AIM framework o sección específica
  if (researchId && (isAimFramework || section)) {
    return (
      <div className="bg-neutral-50">
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <DashboardContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  // Dashboard principal
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
        <DashboardContentWithSuspense />
      </Suspense>
    </ErrorBoundary>
  );
});

DashboardLayout.displayName = 'DashboardLayout';

const DashboardContentWithSuspense = withSearchParams(DashboardContent);
export const DashboardLayoutWithParams = withSearchParams(DashboardLayout);
export { DashboardLayout };
