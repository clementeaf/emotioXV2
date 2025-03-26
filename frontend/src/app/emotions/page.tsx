'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { EmotionsList } from '@/components/EmotionsList';
import { useAuth } from '@/hooks/useAuth';

export default function EmotionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <EmotionsList />
      </div>
    </main>
  );
} 