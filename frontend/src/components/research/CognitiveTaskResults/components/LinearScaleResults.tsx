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

  // Preparar datos para las opciones
  const optionsData = Object.entries(distribution).map(([value, count]) => ({
    optionNumber: parseInt(value),
    count,
    percentage: Math.round((count / totalResponses) * 100)
  })).sort((a, b) => a.optionNumber - b.optionNumber);

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

  // Calcular estadísticas
  const maxValue = Math.max(...Object.values(distribution));
  const minValue = Math.min(...Object.values(distribution));
  const range = scaleRange.end - scaleRange.start + 1;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header de la pregunta */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{question}</h3>
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
        
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Contenido principal con opciones y barras */}
      <div className="p-6">
        <div className="space-y-6">
          {optionsData.map((option) => (
            <div key={option.optionNumber} className="flex items-center space-x-6">
              <div className="w-28 text-sm font-medium text-gray-700">
                Option {option.optionNumber.toString().padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-8 shadow-inner">
                    <div
                      className={`h-8 rounded-full transition-all duration-500 ease-out ${getBarColor(option.optionNumber, option.percentage)}`}
                      style={{ 
                        width: `${option.percentage}%`,
                        minWidth: option.percentage > 0 ? '20px' : '0px'
                      }}
                    ></div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-end pr-3">
                    <span className="text-sm font-semibold text-white drop-shadow-lg">
                      {option.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con información adicional */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-bold text-gray-900 text-lg">Question</span>
        </div>
        
        <p className="text-sm text-gray-600 italic pl-10">
          "This was the best app my eyes had see"
        </p>
      </div>

      {/* Panel lateral con estadísticas */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-semibold text-gray-800 text-lg">Responses</span>
        </div>
        
        <div className="flex items-center space-x-3 mb-6">
          <span className="text-3xl font-bold text-gray-900">{totalResponses.toLocaleString()}</span>
          {responseTime && (
            <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{responseTime}</span>
          )}
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-xl font-bold text-blue-600">{average.toFixed(1)}</div>
            <div className="text-xs text-blue-600 font-medium">Promedio</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-xl font-bold text-green-600">{totalResponses}</div>
            <div className="text-xs text-green-600 font-medium">Respuestas</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-xl font-bold text-purple-600">{range}</div>
            <div className="text-xs text-purple-600 font-medium">Rango</div>
          </div>
        </div>

        {/* Análisis de tendencias */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Análisis de Tendencias</h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>• <strong>Rango de escala:</strong> {scaleRange.start} - {scaleRange.end}</p>
            <p>• <strong>Valor más frecuente:</strong> {optionsData.find(item => item.count === maxValue)?.optionNumber}</p>
            <p>• <strong>Valor menos frecuente:</strong> {optionsData.find(item => item.count === minValue)?.optionNumber}</p>
            <p>• <strong>Distribución:</strong> {average > (scaleRange.start + scaleRange.end) / 2 ? 'Tendencia positiva' : 'Tendencia negativa'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
