import React from 'react';
import { useGroupedResponses, useQuestionStats } from '../../hooks/useGroupedResponses';
import { QuestionWithResponses } from '../../shared/interfaces/module-response.interface';

interface GroupedResponsesViewerProps {
  researchId: string;
}

/**
 * Componente para visualizar respuestas agrupadas por pregunta
 * Esta estructura es más eficiente para análisis estadísticos
 */
export const GroupedResponsesViewer: React.FC<GroupedResponsesViewerProps> = ({ researchId }) => {
  const { data, isLoading, error } = useGroupedResponses(researchId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando respuestas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error al cargar respuestas</h3>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-gray-800 font-medium">No hay respuestas disponibles</h3>
        <p className="text-gray-600 text-sm mt-1">Aún no se han registrado respuestas para este research.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-blue-800 font-semibold text-lg">Resumen de Respuestas</h2>
        <p className="text-blue-600 text-sm mt-1">
          Total de preguntas: {data.data.length} |
          Total de participantes: {new Set(data.data.flatMap(q => q.responses.map(r => r.participantId))).size}
        </p>
      </div>

      {data.data.map((questionData) => (
        <QuestionResponseCard key={questionData.questionKey} questionData={questionData} />
      ))}
    </div>
  );
};

/**
 * Componente para mostrar las respuestas de una pregunta específica
 */
const QuestionResponseCard: React.FC<{ questionData: QuestionWithResponses }> = ({ questionData }) => {
  const { questionKey, responses } = questionData;
  const { stats } = useQuestionStats(researchId, questionKey);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 capitalize">
          {questionKey.replace(/_/g, ' ')}
        </h3>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>{responses.length} respuestas</span>
          <span>{stats.uniqueParticipants} participantes únicos</span>
        </div>
      </div>

      {/* Estadísticas básicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{responses.length}</div>
          <div className="text-sm text-gray-600">Total respuestas</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-gray-900">{stats.uniqueParticipants}</div>
          <div className="text-sm text-gray-600">Participantes únicos</div>
        </div>
        {typeof stats.averageValue === 'number' && !isNaN(stats.averageValue) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">{stats.averageValue.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Promedio</div>
          </div>
        )}
      </div>

      {/* Distribución de valores */}
      {Object.keys(stats.valueDistribution).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Distribución de valores:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.valueDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([value, count]) => (
                <div key={value} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {value}: {count}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Lista de respuestas recientes */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Respuestas recientes:</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {responses
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 5)
            .map((response, index) => (
              <div key={`${response.participantId}-${index}`} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500 text-xs">
                    {response.participantId.slice(0, 8)}...
                  </span>
                  <span className="text-gray-900">
                    {typeof response.value === 'object' ? JSON.stringify(response.value) : String(response.value)}
                  </span>
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(response.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Variable temporal para el researchId - en un componente real esto vendría como prop
const researchId = "193b949e-9fac-f000-329b-e71bab5a9203";
