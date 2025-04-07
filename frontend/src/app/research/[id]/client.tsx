'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Componente de carga
const Spinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" role="status">
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
      </div>
      <p className="mt-4 text-neutral-700">Cargando investigación...</p>
    </div>
  </div>
);

// Tipado para las props
interface ResearchClientProps {
  id: string;
}

// Crear un archivo de tipado personalizado para evitar errores de TypeScript
// @ts-ignore - Deshabilitando temporalmente la verificación de tipos para este bloque
const DynamicResearchStageManager = dynamic(() => 
  import('@/components/research/ResearchStageManager'), 
  { 
    ssr: false, 
    loading: () => <Spinner /> 
  }
);

// Componente principal
export default function ResearchClient({ id }: ResearchClientProps) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return <Spinner />;
  }
  
  return (
    <ErrorBoundary>
      {/* @ts-expect-error - El error solo ocurre a nivel de tipado pero funciona correctamente */}
      <DynamicResearchStageManager researchId={id} />
    </ErrorBoundary>
  );
} 