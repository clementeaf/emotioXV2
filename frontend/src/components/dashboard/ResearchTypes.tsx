'use client';

import { ResearchTypesProps } from '@/interfaces/research';

import { ErrorBoundary } from '../common/ErrorBoundary';

function ResearchTypesContent() {
  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
      </div>
      <div className="p-6">
        <div className="text-center text-neutral-500 text-sm">
          No hay datos de tipos de investigación disponibles
        </div>
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
