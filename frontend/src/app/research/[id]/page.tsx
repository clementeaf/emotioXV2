'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Cargar ResearchStageManager dinámicamente con el tipo correcto
const ResearchStageManager = dynamic(
  () => import('@/components/research/ResearchStageManager'),
  { 
    ssr: false,
    loading: () => <div>Cargando...</div>
  }
);

interface PageProps {
  params: {
    id: string;
  };
}

export default function ResearchPage({ params }: PageProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>Cargando investigación...</div>;
  }
  
  return <ResearchStageManager researchId={params.id} />;
} 