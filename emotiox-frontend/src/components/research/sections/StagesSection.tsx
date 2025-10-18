import React from 'react';
import type { StagesSectionProps } from '../../../types/research-creation.interface';

/**
 * Sección de configuración de etapas
 */
export const StagesSection: React.FC<StagesSectionProps> = ({ id }) => (
  <div className="space-y-6">
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-neutral-900">
        Configurar Etapas
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Configura las etapas de tu investigación
      </p>
    </div>

    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
      <h3 className="text-lg font-semibold text-purple-800 mb-2">
        Gestión de Etapas
      </h3>
      <p className="text-purple-600 mb-4">
        Aquí se implementará el gestor de etapas para la investigación ID: {id}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">Etapa 1: Configuración</h4>
          <p className="text-sm text-gray-600">Configuración inicial de la investigación</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">Etapa 2: Participantes</h4>
          <p className="text-sm text-gray-600">Gestión de participantes</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">Etapa 3: Ejecución</h4>
          <p className="text-sm text-gray-600">Ejecución de la investigación</p>
        </div>
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-800 mb-2">Etapa 4: Análisis</h4>
          <p className="text-sm text-gray-600">Análisis de resultados</p>
        </div>
      </div>
    </div>
  </div>
);
