'use client';

export interface LinearScaleData {
  question: string;
  description?: string;
  scaleRange: { start: number; end: number };
  responses: { value: number; count: number }[];
  average: number;
  totalResponses: number;
  distribution: Record<number, number>;
  responseTime?: string;
}

interface LinearScaleResultsProps {
  data: LinearScaleData;
}

/**
 * Componente para mostrar resultados de preguntas de escala lineal
 * Implementa la visualización horizontal con barras de colores como en la imagen de referencia
 */
export function LinearScaleResults({ data }: LinearScaleResultsProps) {
  const { question, description, scaleRange, responses, average, totalResponses, distribution, responseTime } = data;

  // Generar todas las opciones de la escala (desde startValue hasta endValue)
  const optionsData = Array.from({ length: scaleRange.end - scaleRange.start + 1 }, (_, index) => {
    const optionNumber = scaleRange.start + index;
    const count = distribution[optionNumber] || 0;
    const percentage = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;

    return {
      optionNumber,
      count,
      percentage
    };
  });

  /**
   * Determina el color de la barra basado en el valor y porcentaje
   * - Valores bajos con alto porcentaje: Rojo (negativo)
   * - Valores bajos con bajo porcentaje: Gris (neutral)
   * - Valores altos: Verde (positivo)
   */
  const getBarColor = (optionNumber: number, percentage: number) => {
    const midPoint = (scaleRange.start + scaleRange.end) / 2;

    // Valores bajos (1-3 en escala 1-5, o 1-5 en escala 1-10)
    if (optionNumber <= midPoint) {
      return percentage > 25 ? 'bg-red-500' : 'bg-gray-400';
    }
    // Valores altos (4-5 en escala 1-5, o 6-10 en escala 1-10)
    else {
      return 'bg-green-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header de la pregunta */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
            Linear Scale question
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

      {/* Contenido principal con opciones y barras */}
      <div className="space-y-4">
        {optionsData.map((option) => (
          <div key={option.optionNumber} className="flex items-center space-x-4">
            <div className="w-16 text-sm font-medium text-gray-700">
              {option.optionNumber}
            </div>
            <div className="flex-1">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div
                    className={`h-6 rounded-full transition-all duration-300 ${getBarColor(option.optionNumber, option.percentage)}`}
                    style={{
                      width: `${option.percentage}%`,
                      minWidth: option.percentage > 0 ? '16px' : '0px'
                    }}
                  ></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {option.percentage}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer con información adicional */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900">Question</span>
        </div>

        <p className="text-sm text-gray-600 italic pl-7">
          {description || "This was the best app my eyes had see"}
        </p>
      </div>
    </div>
  );
}
