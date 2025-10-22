'use client';

import { Suspense } from 'react';

import { ConfigCard } from '@/components/common/ConfigCard';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
// import { useStageManager } from '../hooks/useStageManager';


interface ResearchStageManagerProps {
  researchId: string;
}

// Componente interno simplificado después de limpieza radical
function ResearchStageManagerContent({ researchId }: ResearchStageManagerProps) {
  return (
    <div className="flex flex-col justify-start pt-3">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Gestión de Etapas de Investigación
        </h1>
      </div>
      <ConfigCard>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Sistema de Etapas Simplificado
          </h2>
          <p className="text-gray-600 mb-4">
            ID de Investigación: <code className="bg-gray-100 px-2 py-1 rounded">{researchId}</code>
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              🚧 En Desarrollo
            </h3>
            <p className="text-blue-700">
              Este componente será reemplazado por un sistema JSON-driven 
              que permitirá gestionar etapas dinámicamente.
            </p>
          </div>
        </div>
      </ConfigCard>
    </div>
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

