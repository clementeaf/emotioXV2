'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Spinner } from '@/components/ui/Spinner';
import { useResearchClient } from '@/hooks/useResearchClient';
import dynamic from 'next/dynamic';

interface ResearchClientProps {
  id: string;
}

const DynamicResearchStageManager = dynamic(
  () => import('@/components/research/ResearchStageManager').then(mod => ({ default: mod.ResearchStageManager })),
  {
    ssr: false,
    loading: () => <Spinner message="Cargando investigación..." />
  }
);

export default function ResearchClient({ id }: ResearchClientProps) {
  const { isClient } = useResearchClient();

  if (!isClient) {
    return <Spinner message="Inicializando..." />;
  }

  return (
    <ErrorBoundary>
      <DynamicResearchStageManager researchId={id} />
    </ErrorBoundary>
  );
}
