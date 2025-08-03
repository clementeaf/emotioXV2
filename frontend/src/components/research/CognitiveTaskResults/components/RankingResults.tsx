'use client';

// Interfaz para la distribución de votos en una escala
export interface RankingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  6: number;
}

// Interfaz para cada opción del ranking
export interface RankingOption {
  id: string;
  text: string;
  mean: number;
  distribution: RankingDistribution;
  responseTime: string;
}

// Interfaz para los datos completos del ranking
export interface RankingQuestionData {
  options: RankingOption[];
  question?: string;
}

interface RankingResultsProps {
  data: RankingQuestionData;
}

/**
 * Componente para mostrar resultados de preguntas de ranking
 * Implementa la visualización horizontal como en la imagen de referencia
 */
export function RankingResults({ data }: RankingResultsProps) {
  // Debug: Verificar datos
  console.log('[RankingResults] Data recibida:', data);
  console.log('[RankingResults] Opciones:', data.options);

  // Ordenar las opciones por media (de menor a mayor - mejor ranking primero)
  const sortedOptions = [...data.options].sort((a, b) => a.mean - b.mean);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header de la pregunta */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{data.question || "3.6.-Question"}</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Ranking question
          </span>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Conditionality disabled
          </span>
          <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            Required
          </span>
          <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Opciones con barras horizontales */}
      <div className="space-y-4">
        {sortedOptions.map((option) => (
          <div key={option.id} className="space-y-2">
            {/* Nombre de la opción */}
            <div className="font-medium text-gray-700">
              {option.text}
            </div>

            {/* Barra horizontal */}
            <div className="w-full bg-gray-200 rounded-full h-6 shadow-inner">
              <div
                className="bg-blue-400 h-6 rounded-full transition-all duration-300 ease-out"
                style={{ width: '85%' }} // Valor fijo por ahora, se puede hacer dinámico
              ></div>
            </div>

            {/* Valores alineados a la derecha */}
            <div className="flex justify-end space-x-4 text-sm text-gray-600">
              <span>{option.mean.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace('.', ',')}</span>
              <span>{option.responseTime}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
