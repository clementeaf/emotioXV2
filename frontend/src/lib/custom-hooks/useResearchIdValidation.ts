import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { researchAPI } from '@/lib/api';
import { cleanResearchFromLocalStorage } from '@/lib/cleanup/localStorageCleanup';

/**
 * Hook personalizado que valida si un ID de investigación existe
 * y redirecciona al dashboard si no existe
 * 
 * @param researchId ID de la investigación a validar
 * @param redirectUrl URL a la que redirigir si la investigación no existe (por defecto: /dashboard)
 */
export function useResearchIdValidation(researchId: string | null | undefined, redirectUrl: string = '/dashboard') {
  const router = useRouter();
  
  useEffect(() => {
    // No hacer nada si no hay ID
    if (!researchId) return;
    
    // Función asíncrona para validar el ID
    const validateResearchId = async () => {
      try {
        // Verificar si la investigación existe
        await researchAPI.get(researchId);
        // Si llegamos aquí, la investigación existe
      } catch (error: any) {
        // Si recibimos error 404, la investigación no existe
        if (error?.response?.status === 404 || 
            (error?.message && error.message.includes('404'))) {
          
          // Limpiar localStorage usando la utilidad centralizada
          cleanResearchFromLocalStorage(researchId);
          
          // Redireccionar
          router.push(redirectUrl);
        }
      }
    };
    
    // Ejecutar la validación
    validateResearchId();
    
  }, [researchId, redirectUrl, router]);
}

export default useResearchIdValidation; 