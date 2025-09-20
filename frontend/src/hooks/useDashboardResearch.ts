import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGlobalResearchData } from '@/hooks/useGlobalResearchData';
import { ActiveResearch } from '../../../shared/interfaces/dashboard.interface';

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

  // Usar el hook centralizado en lugar de localStorage
  const { researchData, isLoading } = useGlobalResearchData(researchId || '');

  useEffect(() => {
    if (!researchId) {
      handleNoResearch();
      return;
    }

    if (researchData) {
      setActiveResearch({
        id: researchData.id,
        name: researchData.name
      });

      // Detectar si es AIM Framework basado en la técnica
      const researchWithTechnique = researchData as { technique?: string };
      const isAim = researchWithTechnique.technique === 'aim-framework' || searchParams?.get('aim') === 'true';
      setIsAimFramework(isAim);

      // Redirigir a AIM Framework si es necesario
      if (isAim && !searchParams?.get('section')) {
        router.replace(`/dashboard?research=${researchId}&aim=true&section=welcome-screen`);
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
    isLoading
  };
};
