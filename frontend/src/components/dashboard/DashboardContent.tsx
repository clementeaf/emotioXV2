'use client';

import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import { useDashboardResearch } from '@/hooks/useDashboardResearch';
import { memo } from 'react';
import { DashboardMainContent } from './DashboardMainContent';
import { DashboardStats } from './DashboardStats';

/**
 * Componente principal del contenido del dashboard
 */
export const DashboardContent = memo(() => {
  const { researchId, section, isAimFramework, activeResearch } = useDashboardResearch();

  // Si hay una investigación activa con AIM framework o sección específica
  if (activeResearch && (isAimFramework || section)) {
    return <ResearchStageManager researchId={activeResearch.id} />;
  }

  // Dashboard principal
  return (
    <div className="liquid-glass flex-1 mt-10 ml-4 p-4 rounded-2xl mb-4 min-h-[calc(100vh-6rem)] flex flex-col justify-start">
      <div className="mx-auto px-6 py-8 w-full">
        <DashboardStats />
        <DashboardMainContent />
      </div>
    </div>
  );
});

DashboardContent.displayName = 'DashboardContent';
