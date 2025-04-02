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

interface ResearchClientProps {
  id: string;
}

export default function ResearchClient({ id }: ResearchClientProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <div>Cargando investigación...</div>;
  }
  
  return <ResearchStageManager researchId={id} />;
} 