'use client';

import { Suspense } from 'react';

import { ConfigCard } from '@/components/common/ConfigCard';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useStageManager } from './hooks/useStageManager';


interface ResearchStageManagerProps {
  researchId: string;
}

// Componente interno que usa useSearchParams
function ResearchStageManagerContent({ researchId }: ResearchStageManagerProps) {
  const { renderStageContent } = useStageManager(researchId);

  return (
    <ConfigCard>
      {renderStageContent()}
    </ConfigCard>
  );
}

// Usar el HOC para envolver el componente
const ResearchStageManagerContentWithParams = withSearchParams(ResearchStageManagerContent);

// Componente público que exportamos
export function ResearchStageManager(props: ResearchStageManagerProps) {
  return (
    <Suspense fallback={<LoadingSkeleton type="layout" />}>
      <ResearchStageManagerContentWithParams {...props} />
    </Suspense>
  );
}
