import { welcomeScreenService } from '@/services/welcomeScreen.service';
import { useQuery } from '@tanstack/react-query';
import { WelcomeScreenRecord } from '../../../shared/interfaces/welcome-screen.interface';

/**
 * Hook centralizado para obtener datos de welcome-screen
 * Evita llamadas duplicadas usando React Query con caching
 */
export const useWelcomeScreenData = (researchId: string) => {
  return useQuery<WelcomeScreenRecord | null>({
    queryKey: ['welcomeScreen', researchId],
    queryFn: async () => {
      if (!researchId || researchId === 'current') {
        return null;
      }

      try {
        // Limpiar cache local si existe
        try {
          localStorage.removeItem(`welcome_screen_resource_${researchId}`);
        } catch (e) {
          // Ignorar errores de localStorage
        }

        const record = await welcomeScreenService.getByResearchId(researchId);
        return record;
      } catch (error: any) {
        // Si es 404 o not found, retornar null en lugar de error
        if (error?.statusCode === 404 ||
          error?.message?.includes('not found') ||
          error?.message?.includes('WELCOME_SCREEN_NOT_FOUND')) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!researchId && researchId !== 'current',
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      if (error?.statusCode === 404) {
        return false; // No reintentar si es 404
      }
      return failureCount < 3; // Reintentar hasta 3 veces para otros errores
    },
  });
};
