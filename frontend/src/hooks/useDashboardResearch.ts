import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGlobalResearchData } from '@/hooks/useGlobalResearchData';
import { ActiveResearch } from '../../../shared/interfaces/dashboard.interface';
import { getTechniqueStages } from '@/config/techniques-registry';

/**
 * Hook personalizado para manejar la lógica de research en el dashboard
 */
export const useDashboardResearch = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;

  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<ActiveResearch | undefined>(undefined);

  // Usar el hook centralizado solo si hay researchId
  const { researchData, isLoading } = useGlobalResearchData(researchId || '');


  // Si no hay researchId, no deberíamos estar loading
  const actualLoading = researchId ? isLoading : false;

  useEffect(() => {
    if (!researchId) {
      handleNoResearch();
      return;
    }

    if (researchData) {
      // Handle both array and single object response
      const research = Array.isArray(researchData) ? researchData[0] : researchData;

      if (research) {
        setActiveResearch({
          id: research.id,
          name: research.name
        });

        // Detectar si es AIM Framework basado en la técnica
        const isAim = research.technique === 'aim-framework' || searchParams?.get('aim') === 'true';
        setIsAimFramework(isAim);

        // Si no hay section en la URL, redirigir al primer stage de la técnica
        // Para biometric-cognitive, saltar screener y usar welcome-screen como default
        if (!searchParams?.get('section')) {
          const technique = research.technique || '';
          const techniqueStages = getTechniqueStages(technique);
          
          // Para biometric-cognitive, usar welcome-screen como default (saltar screener)
          // Para otras técnicas, usar el primer stage disponible
          let firstStage = techniqueStages[0] || 'welcome-screen';
          if (technique === 'biometric-cognitive' && techniqueStages.length > 1) {
            // Buscar welcome-screen en los stages, si no existe usar el segundo stage
            firstStage = techniqueStages.find(stage => stage === 'welcome-screen') || techniqueStages[1] || 'welcome-screen';
          }
          
          if (isAim) {
            router.replace(`/dashboard?research=${researchId}&aim=true&section=${firstStage}`);
          } else {
            router.replace(`/dashboard?research=${researchId}&section=${firstStage}`);
          }
        }
      }
    }
  }, [researchId, researchData, searchParams, router]);

  const handleNoResearch = () => {
    setActiveResearch(undefined);
    setIsAimFramework(false);
  };

  return {
    researchId,
    section,
    isAimFramework,
    activeResearch,
    isLoading: actualLoading
  };
};
