'use client';

import { useResearchList } from '@/api';
import { ResearchTypesProps } from '@/interfaces/research';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { ResearchAPIResponse } from '@/types/research';

function ResearchTypesContent() {
  // Usar el hook centralizado para obtener research data
  const { data: researchData = [], isLoading, error } = useResearchList();

  // Extraer tipos únicos de investigación
  const researchTypes = Array.from(new Set(researchData.map((research: ResearchAPIResponse) => research.technique || 'unknown')));

  const getTypeDisplayName = (type: string | undefined) => {
    if (!type) return 'Unknown';
    const typeNames: { [key: string]: string } = {
      'eye-tracking': 'Eye Tracking',
      'aim-framework': 'AIM Framework',
      'smart-voc': 'Smart VOC',
      'cognitive-task': 'Tarea Cognitiva'
    };
    return typeNames[type] || type;
  };

  const getTypeCount = (type: string) => {
    return researchData.filter((research: ResearchAPIResponse) => research.technique === type).length;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-red-500 text-sm">
            Error al cargar los tipos de investigación
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
      </div>
      <div className="p-6">
        {researchTypes.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm">
            No hay tipos de investigación disponibles
          </div>
        ) : (
          <div className="space-y-3">
            {researchTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm font-medium text-neutral-700">
                  {getTypeDisplayName(type)}
                </span>
                <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded">
                  {getTypeCount(type || '')} investigación{getTypeCount(type || '') !== 1 ? 'es' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResearchTypes({ className }: ResearchTypesProps) {
  return (
    <ErrorBoundary>
      <div className={className}>
        <ResearchTypesContent />
      </div>
    </ErrorBoundary>
  );
}
