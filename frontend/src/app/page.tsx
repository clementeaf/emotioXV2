'use client';

import { useAuth } from '@/providers/AuthProvider';
import { LoginForm } from '@/components/auth/LoginForm';
import { DashboardContent } from '@/components/dashboard/DashboardContent';

export default function Home() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {user ? <DashboardContent /> : <LoginForm />}
    </main>
  );
}
