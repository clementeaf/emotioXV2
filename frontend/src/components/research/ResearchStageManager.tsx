'use client';

import { Suspense } from 'react';

import { ConfigCard } from '@/components/common/ConfigCard';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { StageLoadingState } from './loading/StageLoadingState';
import { useStageManager } from './hooks/useStageManager';


interface ResearchStageManagerProps {
  researchId: string;
}

// Componente interno que usa useSearchParams
function ResearchStageManagerContent({ researchId }: ResearchStageManagerProps) {
  const { stageTitle, renderStageContent } = useStageManager(researchId);

  return (
    <div className="liquid-glass flex-1 mt-8 ml-4 p-10 rounded-2xl mb-4 flex flex-col justify-start">
      <h1 className="text-2xl font-semibold text-neutral-900">{stageTitle}</h1>
      <ConfigCard>
        {renderStageContent()}
      </ConfigCard>
    </div>
  );
}

// Usar el HOC para envolver el componente
const ResearchStageManagerContentWithParams = withSearchParams(ResearchStageManagerContent);

// Componente público que exportamos
export function ResearchStageManager(props: ResearchStageManagerProps) {
  return (
    <Suspense fallback={<StageLoadingState />}>
      <ResearchStageManagerContentWithParams {...props} />
    </Suspense>
  );
}

