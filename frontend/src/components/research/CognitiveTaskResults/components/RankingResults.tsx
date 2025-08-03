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
}

interface RankingResultsProps {
  data: RankingQuestionData;
}

/**
 * Componente para mostrar resultados de preguntas de ranking
 * Implementa la visualización horizontal con escala numérica como en la imagen de referencia
 */
export function RankingResults({ data }: RankingResultsProps) {
  // Ordenar las opciones por media (de mayor a menor)
  const sortedOptions = [...data.options].sort((a, b) => b.mean - a.mean);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header de la pregunta */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Cual es tu mayor preferencia</h3>
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
          </div>
        </div>
      </div>

      {/* Contenido principal con escala horizontal */}
      <div className="p-6">
        <div className="space-y-6">
          {sortedOptions.map((option, index) => (
            <div key={option.id} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{option.text}</h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Mean: {option.mean.toFixed(1)}</span>
                  <span>Secs: {option.responseTime}</span>
                </div>
              </div>

              {/* Escala horizontal con distribución */}
              <div className="relative">
                <div className="flex items-center space-x-2 mb-2">
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <div key={num} className="flex-1 text-center">
                      <div className="text-xs font-medium text-gray-700">{num}</div>
                    </div>
                  ))}
                </div>

                {/* Barras de distribución */}
                <div className="flex items-end space-x-2 h-16">
                  {[1, 2, 3, 4, 5, 6].map(num => {
                    const value = option.distribution[num as keyof RankingDistribution];
                    const maxValue = Math.max(...Object.values(option.distribution));
                    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                    return (
                      <div key={num} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-500 rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${height}%`,
                            minHeight: value > 0 ? '4px' : '0px'
                          }}
                        ></div>
                        <div className="text-xs text-gray-500 mt-1">{value}</div>
                      </div>
                    );
                  })}
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
          "Ordena las opciones según tu preferencia"
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
          <span className="text-3xl font-bold text-gray-900">{data.options.length}</span>
          <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">opciones</span>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-xl font-bold text-blue-600">
              {(data.options.reduce((sum, opt) => sum + opt.mean, 0) / data.options.length).toFixed(1)}
            </div>
            <div className="text-xs text-blue-600 font-medium">Promedio</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-xl font-bold text-green-600">{data.options.length}</div>
            <div className="text-xs text-green-600 font-medium">Opciones</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="text-xl font-bold text-purple-600">1-6</div>
            <div className="text-xs text-purple-600 font-medium">Rango</div>
          </div>
        </div>

        {/* Análisis de tendencias */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">Análisis de Tendencias</h4>
          <div className="text-xs text-gray-600 space-y-2">
            <p>• <strong>Rango de escala:</strong> 1 - 6</p>
            <p>• <strong>Opción más preferida:</strong> {sortedOptions[0]?.text}</p>
            <p>• <strong>Opción menos preferida:</strong> {sortedOptions[sortedOptions.length - 1]?.text}</p>
            <p>• <strong>Distribución:</strong> Ranking de preferencias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
