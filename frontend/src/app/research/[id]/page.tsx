'use client';

import { ResearchStageManager } from '@/components/research/ResearchStageManager';

interface PageProps {
  params: {
    id: string;
  };
}

export default function ResearchPage({ params }: PageProps) {
  return <ResearchStageManager researchId={params.id} />;
} 