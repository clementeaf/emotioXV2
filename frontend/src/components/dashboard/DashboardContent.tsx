'use client';

import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import { useDashboardResearch } from '@/hooks/useDashboardResearch';
import { useResearchList } from '@/api/domains/research';
import { memo, useMemo } from 'react';
import { DashboardMainContent } from './DashboardMainContent';
import { DashboardStats } from './DashboardStats';

/**
 * Componente principal del contenido del dashboard
 */
export const DashboardContent = memo(() => {
  const { researchId, section, isAimFramework, activeResearch, isLoading } = useDashboardResearch();
  const { data: researchList = [], isLoading: isLoadingResearch } = useResearchList();


  // Calculate dashboard stats from research list
  const dashboardStats = useMemo(() => {
    const totalResearch = researchList.length;
    const inProgress = researchList.filter(r => r.status === 'in-progress' || r.status === 'active').length;
    const completed = researchList.filter(r => r.status === 'completed').length;
    // For participants, we would need additional data - for now use 0
    const participants = 0;

    return { totalResearch, inProgress, completed, participants };
  }, [researchList]);

  // Solo mostrar loading si NO hay datos en cache
  const hasData = researchList.length > 0;
  const shouldShowLoading = (isLoading || isLoadingResearch) && !hasData;

  if (shouldShowLoading) {
    return (
      <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] overflow-y-auto">
        <div className="mx-auto px-6 py-8 w-full">
          <LoadingSkeleton type="dashboard" />
        </div>
      </div>
    );
  }

  // Si hay una investigación activa con AIM framework o sección específica
  if (activeResearch && (isAimFramework || section)) {
    return <ResearchStageManager researchId={activeResearch.id} />;
  }

  // Dashboard principal
  return (
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] flex flex-col justify-start overflow-y-auto">
      <div className="mx-auto px-6 py-8 w-full">
        <DashboardStats {...dashboardStats} />
        <DashboardMainContent />
      </div>
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';
