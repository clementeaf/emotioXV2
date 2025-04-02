'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redireccionar automáticamente a la página de login
    router.replace('/login');
  }, [router]);

  // Mostrar un mensaje de carga mientras se redirecciona
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-neutral-300 mb-4"></div>
        <p className="text-lg">Redireccionando...</p>
      </div>
    </main>
  );
}
