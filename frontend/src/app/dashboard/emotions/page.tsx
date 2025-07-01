'use client';

import { SearchParamsWrapper } from '@/components/common/SearchParamsWrapper';
import { EmotionsList } from '@/components/EmotionsList';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { Suspense } from 'react';

export default function EmotionsPage() {
  const { token } = useProtectedRoute();
  if (!token) {
    return null;
  }
  return (
    <div className="bg-white rounded-xl shadow p-6 min-h-[400px]">
      <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
        <SearchParamsWrapper>
          <EmotionsList />
        </SearchParamsWrapper>
      </Suspense>
    </div>
  );
}
