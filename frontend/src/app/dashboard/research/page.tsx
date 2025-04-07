'use client';

import { useRouter } from 'next/navigation';
import { memo, Suspense } from 'react';

import ResearchList from '@/components/dashboard/ResearchList';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Componente interno memoizado
const ResearchListContent = memo(() => {
  return <ResearchList />;
});

ResearchListContent.displayName = 'ResearchListContent';

// Contenido principal de la página
const ResearchPageContent = memo(() => (
  <div className="flex-1">
    <div className="container mx-auto px-6 py-6">
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
));

ResearchPageContent.displayName = 'ResearchPageContent';

// Envolver con el HOC
const ResearchListWithSuspense = withSearchParams(ResearchListContent);

export default function ResearchPage() {
  const router = useRouter();
  const { token } = useProtectedRoute();
  
  if (!token) {
    return null;
  }
  
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <ErrorBoundary>
          <ResearchPageContent />
        </ErrorBoundary>
      </div>
    </div>
  );
} 