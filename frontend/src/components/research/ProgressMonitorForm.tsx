'use client';

import { memo } from 'react';

interface ProgressMonitorFormProps {
  className?: string;
}

export function ProgressMonitorForm({ className }: ProgressMonitorFormProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-neutral-200 p-6 ${className || ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Monitor de Progreso</h3>
      </div>

      <div className="text-center text-neutral-500 text-sm py-8">
        No hay datos de progreso disponibles
      </div>
    </div>
  );
}

export default memo(ProgressMonitorForm);
