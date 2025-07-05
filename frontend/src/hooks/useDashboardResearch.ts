import { cleanAllResearchFromLocalStorage } from '@/lib/cleanup/localStorageCleanup';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ActiveResearch, ResearchData } from '../../../shared/interfaces/dashboard.interface';

/**
 * Hook personalizado para manejar la lógica de research en el dashboard
 */
export const useDashboardResearch = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Nuevo: loading para SSR/hidratación
  const [isLoading, setIsLoading] = useState(true);

  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;
  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<ActiveResearch | undefined>(undefined);

  // DEBUG: Agregar logs para entender qué está pasando
  console.log('[useDashboardResearch] Debug info:', {
    researchId,
    section,
    aim: searchParams?.get('aim'),
    isAimFramework,
    searchParams: Object.fromEntries(searchParams?.entries() || [])
  });

  useEffect(() => {
    // Si no hay researchId, limpiar y salir
    if (!researchId) {
      handleNoResearch();
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    handleResearchLoad(researchId);
    setIsLoading(false);
  }, [researchId, searchParams, router, section]);

  const handleResearchLoad = (researchId: string) => {
    try {
      const storedResearch = typeof window !== 'undefined' ? localStorage.getItem(`research_${researchId}`) : null;
      let researchData: ResearchData;
      const hasAimParam = searchParams?.get('aim') === 'true';

      console.log('[useDashboardResearch] handleResearchLoad:', {
        researchId,
        hasAimParam,
        section,
        storedResearch: !!storedResearch
      });

      if (storedResearch) {
        researchData = JSON.parse(storedResearch);
        updateExistingResearch(researchData, hasAimParam, researchId);
      } else {
        createNewResearch(researchId, hasAimParam);
      }
    } catch (error) {
      handleResearchError(researchId);
    }
  };

  const updateExistingResearch = (researchData: ResearchData, hasAimParam: boolean, researchId: string) => {
    setActiveResearch({
      id: researchData.id,
      name: researchData.name
    });

    if (hasAimParam && researchData.technique !== 'aim-framework') {
      researchData.technique = 'aim-framework';
      if (typeof window !== 'undefined') {
        localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
      }
    }

    updateResearchList(researchData);
    handleAimFrameworkRedirect(researchData, researchId);
  };

  const createNewResearch = (researchId: string, hasAimParam: boolean) => {
    const newResearchData: ResearchData = {
      id: researchId,
      name: 'Research Project',
      technique: hasAimParam ? 'aim-framework' : '',
      createdAt: new Date().toISOString(),
      status: 'draft'
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(`research_${researchId}`, JSON.stringify(newResearchData));
    }
    updateResearchList(newResearchData);

    setActiveResearch({
      id: researchId,
      name: 'Research Project'
    });

    setIsAimFramework(hasAimParam);

    if (hasAimParam && !searchParams?.get('section')) {
      const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
      console.log('[useDashboardResearch] Redirecting to:', redirectUrl);
      router.replace(redirectUrl);
    }
  };

  const updateResearchList = (researchData: ResearchData) => {
    const newResearchList = [{
      id: researchData.id,
      name: researchData.name,
      technique: researchData.technique || '',
      createdAt: researchData.createdAt || new Date().toISOString()
    }];
    if (typeof window !== 'undefined') {
      localStorage.setItem('research_list', JSON.stringify(newResearchList));
    }
  };

  const handleAimFrameworkRedirect = (researchData: ResearchData, researchId: string) => {
    const isAimFramework = researchData.technique === 'aim-framework';
    const hasAimParam = searchParams?.get('aim') === 'true';
    const currentSection = searchParams?.get('section');

    console.log('[useDashboardResearch] handleAimFrameworkRedirect:', {
      isAimFramework,
      hasAimParam,
      currentSection,
      section
    });

    if (isAimFramework) {
      if (!hasAimParam || !currentSection || currentSection === '' || currentSection === 'null') {
        const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
        console.log('[useDashboardResearch] Redirecting to:', redirectUrl);
        router.replace(redirectUrl);
      }
    }
    setIsAimFramework(isAimFramework);
  };

  const handleResearchError = (researchId: string) => {
    setActiveResearch({
      id: researchId,
      name: 'Research Project'
    });
  };

  const handleNoResearch = () => {
    setActiveResearch(undefined);
    setIsAimFramework(false);
    if (typeof window !== 'undefined') {
      cleanAllResearchFromLocalStorage();
    }
  };

  return {
    researchId,
    section,
    isAimFramework,
    activeResearch,
    isLoading
  };
};
