'use client';

import { DashboardLayoutWithParams, DashboardShell } from '@/components/dashboard';
import { useAuth } from '@/providers/AuthProvider';
import { Suspense } from 'react';

/**
 * Página principal del dashboard
 */
export default function DashboardPage() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardShell>
      <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
        <DashboardLayoutWithParams />
      </Suspense>
    </DashboardShell>
  );
}
