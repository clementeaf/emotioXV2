import { memo } from 'react';
import { ResearchTable } from './ResearchTable';
import { ResearchTypes } from './ResearchTypes';

/**
 * Contenido principal del dashboard con tabla de investigaciones y tipos
 */
export const DashboardMainContent = memo(() => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 bg-white rounded-lg shadow-md border border-neutral-100 hover:shadow-lg transition-shadow duration-300 p-6 hover:cursor-pointer">
      <ResearchTable />
    </div>
    <div className="rounded-lg shadow-md border border-neutral-100 hover:shadow-lg transition-shadow duration-300 p-6 hover:cursor-pointer">
      <h2 className="text-lg font-medium mb-6">Tipos de Investigación</h2>
      <ResearchTypes />
    </div>
  </div>
));

DashboardMainContent.displayName = 'DashboardMainContent';
