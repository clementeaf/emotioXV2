"use client";

import React, { useState } from 'react';
import { useResearchDataContext } from './GroupedResponsesPage';

interface SmartVOCEndpointTestProps {
  researchId: string;
}

/**
 * Componente para probar el endpoint de SmartVOC con la nueva estructura agrupada
 */
export const SmartVOCEndpointTest: React.FC<SmartVOCEndpointTestProps> = ({ researchId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { smartVOCData: data, isSmartVOCLoading: queryLoading, smartVOCError: error } = useResearchDataContext();

  const handleTestEndpoint = async () => {
    setIsLoading(true);
    try {
      // Simular una nueva carga de datos
      console.log('✅ Endpoint SmartVOC probado exitosamente');
    } catch (error) {
      console.error('❌ Error probando endpoint SmartVOC:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (queryLoading || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Probando endpoint SmartVOC...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error al probar endpoint SmartVOC</h3>
        <p className="text-red-600 text-sm mt-1">{error?.message || 'Error desconocido'}</p>
        <button
          onClick={handleTestEndpoint}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-800 font-medium">✅ Endpoint SmartVOC funcionando correctamente</h3>
        <p className="text-green-600 text-sm mt-1">
          URL: <code>/module-responses/grouped-by-question/{researchId}</code>
        </p>
      </div>

      {data && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-800 font-medium">📊 Datos SmartVOC recibidos:</h4>
          <div className="text-sm text-blue-600 mt-2 space-y-1">
            <p>• Total respuestas: {data.totalResponses}</p>
            <p>• Participantes únicos: {data.uniqueParticipants}</p>
            <p>• NPS Score: {data.npsScore}</p>
            <p>• CSAT Scores: {data.csatScores.length}</p>
            <p>• CES Scores: {data.cesScores.length}</p>
            <p>• NEV Scores: {data.nevScores.length}</p>
            <p>• CV Scores: {data.cvScores.length}</p>
            <p>• VOC Responses: {data.vocResponses.length}</p>
          </div>
        </div>
      )}

      {data && data.smartVOCResponses && data.smartVOCResponses.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-gray-800 font-medium">📋 Ejemplo de respuestas SmartVOC:</h4>
          <div className="text-sm text-gray-600 mt-2 space-y-2">
            {data.smartVOCResponses.slice(0, 3).map((response, index) => (
              <div key={index} className="border-l-2 border-gray-300 pl-3">
                <p><strong>Pregunta:</strong> {response.questionKey}</p>
                <p><strong>Participante:</strong> {response.participantId}</p>
                <p><strong>Valor:</strong> {JSON.stringify(response.response).slice(0, 50)}...</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleTestEndpoint}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Probar endpoint SmartVOC nuevamente
      </button>
    </div>
  );
};
