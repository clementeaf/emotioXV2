import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { researchAPI } from '@/lib/api';

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
    
    // Función para limpiar localStorage
    const cleanUpLocalStorage = (idToClean: string) => {
      try {
        // Intentar eliminar la entrada principal
        localStorage.removeItem(`research_${idToClean}`);
        
        // Eliminar entradas asociadas
        localStorage.removeItem(`welcome-screen_nonexistent_${idToClean}`);
        localStorage.removeItem(`thank-you-screen_nonexistent_${idToClean}`);
        localStorage.removeItem(`eye-tracking_nonexistent_${idToClean}`);
        localStorage.removeItem(`smart-voc_nonexistent_${idToClean}`);
      } catch (error) {
        // Ignorar errores
      }
    };
    
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
          
          // Limpiar localStorage
          cleanUpLocalStorage(researchId);
          
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