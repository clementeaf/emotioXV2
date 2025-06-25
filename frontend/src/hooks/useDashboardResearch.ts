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

  const researchId = searchParams?.get('research');
  const section = searchParams?.get('section') || null;
  const [isAimFramework, setIsAimFramework] = useState(searchParams?.get('aim') === 'true');
  const [activeResearch, setActiveResearch] = useState<ActiveResearch | undefined>(undefined);

  useEffect(() => {
    if (researchId) {
      handleResearchLoad(researchId);
    } else {
      handleNoResearch();
    }
  }, [researchId, searchParams, router, section]);

  const handleResearchLoad = (researchId: string) => {
    try {
      const storedResearch = localStorage.getItem(`research_${researchId}`);
      let researchData: ResearchData;
      const hasAimParam = searchParams?.get('aim') === 'true';

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
      localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
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

    localStorage.setItem(`research_${researchId}`, JSON.stringify(newResearchData));
    updateResearchList(newResearchData);

    setActiveResearch({
      id: researchId,
      name: 'Research Project'
    });

    setIsAimFramework(hasAimParam);

    if (hasAimParam && !searchParams?.get('section')) {
      const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
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

    localStorage.setItem('research_list', JSON.stringify(newResearchList));
  };

  const handleAimFrameworkRedirect = (researchData: ResearchData, researchId: string) => {
    const isAimFramework = researchData.technique === 'aim-framework';
    const hasAimParam = searchParams?.get('aim') === 'true';

    if (isAimFramework) {
      if (!hasAimParam || !section) {
        const redirectUrl = `/dashboard?research=${researchId}&aim=true${!section ? '&section=welcome-screen' : ''}`;
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
    cleanAllResearchFromLocalStorage();
  };

  return {
    researchId,
    section,
    isAimFramework,
    activeResearch
  };
};
