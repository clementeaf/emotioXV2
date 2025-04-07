import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';

/**
 * Hook personalizado para proteger rutas que requieren autenticación.
 * Redirige al usuario a la página de login si no está autenticado.
 * 
 * @returns {Object} Objeto con el token y estado de autenticación
 */
export const useProtectedRoute = () => {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);
  
  return { isAuthenticated, token };
}; 