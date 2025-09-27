'use client';

import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { useAuth } from '@/providers/AuthProvider';
import { Suspense } from 'react';

/**
 * Página principal del dashboard
 */
export default function DashboardPage() {
  const { user, authLoading } = useAuth();

  if (authLoading || !user) {
    return null;
  }

  return <DashboardContent />;
}
