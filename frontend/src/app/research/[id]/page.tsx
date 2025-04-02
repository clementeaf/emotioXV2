'use client';

import dynamic from 'next/dynamic';

// Cargar ResearchStageManager dinámicamente con el tipo correcto
const ResearchStageManager = dynamic(
  () => import('@/components/research/ResearchStageManager'),
  { ssr: false }
);

interface PageProps {
  params: {
    id: string;
  };
}

export default function ResearchPage({ params }: PageProps) {
  return <ResearchStageManager researchId={params.id} />;
} 