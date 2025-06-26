'use client';

import { Suspense } from 'react';

import { SearchParamsWrapper } from '@/components/common/SearchParamsWrapper';
import { EmotionsContent } from '@/components/emotions/EmotionsContent';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

export default function EmotionsPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col p-8">
        <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
          <SearchParamsWrapper>
            <EmotionsContent />
          </SearchParamsWrapper>
        </Suspense>
      </div>
    </div>
  );
}
