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

  useEffect(() => {
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
      router.replace(redirectUrl);
    }
  };

  const updateResearchList = (researchData: ResearchData) => {
    if (typeof window === 'undefined') return;

    // Obtener la lista existente de localStorage
    const existingListString = localStorage.getItem('research_list');
    let existingList: any[] = [];

    try {
      existingList = existingListString ? JSON.parse(existingListString) : [];
    } catch (error) {
      console.warn('Error parsing research list from localStorage, starting fresh:', error);
      existingList = [];
    }

    // Crear el objeto de investigación actualizado
    const updatedResearch = {
      id: researchData.id,
      name: researchData.name,
      technique: researchData.technique || '',
      createdAt: researchData.createdAt || new Date().toISOString()
    };

    // Buscar si la investigación ya existe en la lista
    const existingIndex = existingList.findIndex(item => item.id === researchData.id);

    if (existingIndex !== -1) {
      // Si existe, actualizar los datos
      existingList[existingIndex] = updatedResearch;
    } else {
      // Si no existe, agregarla al inicio de la lista
      existingList.unshift(updatedResearch);
    }

    // Limitar a las 10 investigaciones más recientes
    const limitedList = existingList.slice(0, 10);

    // Guardar la lista actualizada
    localStorage.setItem('research_list', JSON.stringify(limitedList));
  };

  const handleAimFrameworkRedirect = (researchData: ResearchData, researchId: string) => {
    const isAimFramework = researchData.technique === 'aim-framework';
    const hasAimParam = searchParams?.get('aim') === 'true';
    const currentSection = searchParams?.get('section');

    if (isAimFramework) {
      if (!hasAimParam || !currentSection || currentSection === '' || currentSection === 'null') {
        const redirectUrl = `/dashboard?research=${researchId}&aim=true&section=welcome-screen`;
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
