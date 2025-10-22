"use client";

import React, { createContext, useContext } from 'react';
import { useGlobalResearchData } from '../../../hooks/useGlobalResearchData';

// Imports optimizados desde responses
import { GroupedResponsesTest } from './GroupedResponsesTest';
import { GroupedResponsesViewer } from './GroupedResponsesViewer';

// Contexto para compartir datos entre componentes
const ResearchDataContext = createContext<ReturnType<typeof useGlobalResearchData> | null>(null);

export const useResearchDataContext = () => {
  const context = useContext(ResearchDataContext);
  if (!context) {
    throw new Error('useResearchDataContext debe usarse dentro de ResearchDataProvider');
  }
  return context;
};

interface ResearchDataProviderProps {
  researchId: string;
  children: React.ReactNode;
}

const ResearchDataProvider: React.FC<ResearchDataProviderProps> = ({ researchId, children }) => {
  const researchData = useGlobalResearchData(researchId);

  return (
    <ResearchDataContext.Provider value={researchData}>
      {children}
    </ResearchDataContext.Provider>
  );
};

interface GroupedResponsesPageProps {
  researchId: string;
}

/**
 * Página para visualizar respuestas agrupadas por pregunta
 * Esta estructura es más eficiente para análisis estadísticos
 */
export const GroupedResponsesPageContent: React.FC<GroupedResponsesPageProps> = ({ researchId }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Análisis de Respuestas por Pregunta
          </h1>
          <p className="mt-2 text-gray-600">
            Visualización optimizada para análisis estadísticos de múltiples participantes
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>Research ID: {researchId}</span>
            <span>•</span>
            <span>Estructura optimizada para escalabilidad</span>
          </div>
        </div>

        {/* Provider para compartir datos */}
        <ResearchDataProvider researchId={researchId}>
          {/* Prueba del endpoint general */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Prueba del Endpoint General</h2>
            <GroupedResponsesTest researchId={researchId} />
          </div>

          {/* Prueba del endpoint SmartVOC */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🧪 Prueba del Endpoint SmartVOC</h2>
            {/* ❌ ELIMINADO: SmartVOCEndpointTest - archivo eliminado */}
            {/* <SmartVOCEndpointTest researchId={researchId} /> */}
          </div>

          {/* Contenido principal */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <GroupedResponsesViewer researchId={researchId} />
          </div>
        </ResearchDataProvider>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Ventajas de esta estructura
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Escalabilidad:</strong> Optimizada para cientos de participantes</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Análisis eficiente:</strong> Fácil iteración por pregunta para estadísticas</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Rendimiento:</strong> Menos transferencia de datos y procesamiento más rápido</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span><strong>Flexibilidad:</strong> Fácil acceso a respuestas individuales cuando sea necesario</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
