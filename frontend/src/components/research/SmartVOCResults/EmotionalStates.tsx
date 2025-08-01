import { ArrowDownIcon, ArrowUpIcon, Target } from 'lucide-react';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface EmotionalState {
  name: string;
  value: number;
  isPositive: boolean;
}

interface Cluster {
  name: string;
  value: number;
  trend: 'up' | 'down';
}

interface EmotionalStatesProps {
  className?: string;
  emotionalStates: EmotionalState[];
  longTermClusters: Cluster[];
  shortTermClusters: Cluster[];
  totalResponses?: number;
  responseTime?: string;
  positivePercentage?: number;
  negativePercentage?: number;
}

export function EmotionalStates({
  className,
  emotionalStates,
  longTermClusters,
  shortTermClusters,
  totalResponses = 0,
  responseTime = '0s',
  positivePercentage: customPositivePercentage,
  negativePercentage: customNegativePercentage
}: EmotionalStatesProps) {
  const calculatedPositivePercentage = emotionalStates
    .filter(state => state.isPositive)
    .reduce((acc, state) => acc + state.value, 0);

  const calculatedNegativePercentage = 100 - calculatedPositivePercentage;

  // Usar porcentajes personalizados si se proporcionan, sino calcular automáticamente
  const positivePercentage = customPositivePercentage ?? calculatedPositivePercentage;
  const negativePercentage = customNegativePercentage ?? calculatedNegativePercentage;

  // Verificar si hay datos disponibles
  const hasData = emotionalStates.length > 0;

  // 🎯 DEBUG: Log de los datos recibidos
  console.log('[EmotionalStates] 🔍 Datos recibidos:', {
    emotionalStates,
    longTermClusters,
    shortTermClusters,
    totalResponses,
    positivePercentage: customPositivePercentage,
    negativePercentage: customNegativePercentage,
    hasData,
    calculatedPositive: calculatedPositivePercentage,
    calculatedNegative: calculatedNegativePercentage
  });

  return (
    <Card className={cn('p-6 pb-14', className)}>
      {/* Encabezado de la pregunta */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-lg font-semibold">2.4.-Question: Net Emotional Value (NEV)</h2>
            <span className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded">Linear Scale question</span>
            <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">Conditionality disabled</span>
            <span className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded">Required</span>
          </div>
          <p className="text-gray-600">How do you feel about the experience offered by the [company]?</p>
          <p className="text-gray-500 text-sm">Please select up to 3 options from these 20 emotional moods</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Responses</span>
            <span className="text-2xl font-semibold">{totalResponses}</span>
            <span className="text-sm text-gray-500">{responseTime}</span>
          </div>
          <div className="flex items-center mt-4">
            <Target className="w-12 h-12 text-blue-600" />
            <span className="text-4xl font-bold text-blue-600 ml-2">0</span>
          </div>
        </div>
      </div>

      {/* Barras de emociones positivas/negativas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span>Positive Emotions</span>
          <span className="font-medium">{positivePercentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-[#4ADE80] rounded-full"
            style={{ width: `${positivePercentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between mb-2 mt-4">
          <span>Negative Emotions</span>
          <span className="font-medium">{negativePercentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className="h-full bg-[#F87171] rounded-full"
            style={{ width: `${negativePercentage}%` }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex gap-8">
        {/* Gráfico de estados emocionales */}
        <div className="flex-1">
          <h3 className="text-xl font-light text-gray-500 mb-2">Emotional states</h3>
          <p className="text-2xl font-bold mb-12">{positivePercentage.toFixed(2)}% Positive</p>

          {!hasData && (
            <div className="flex items-center justify-center h-[360px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No hay datos disponibles</p>
                <p className="text-gray-400 text-sm">Los datos de emociones aparecerán aquí cuando se recopilen respuestas</p>
              </div>
            </div>
          )}

          {hasData && (

            <div className="relative h-[360px] mt-8 pb-10">
              {/* Fondo cuadriculado */}
              <div className="absolute inset-0 bottom-10">
                {[100, 50, 0].map((value, i) => (
                  <div
                    key={value}
                    className="border-t border-gray-200"
                    style={{
                      position: 'absolute',
                      top: `${i * 50}%`,
                      left: '2rem',
                      right: 0
                    }}
                  />
                ))}
              </div>

              {/* Valores del eje Y */}
              <div className="absolute left-0 h-[calc(100%-40px)]">
                {[100, 50, 0].map((value, i) => (
                  <div
                    key={value}
                    className="absolute text-sm text-gray-500"
                    style={{ top: `${i * 50}%`, transform: 'translateY(-50%)' }}
                  >
                    {value}
                  </div>
                ))}
              </div>

              {/* Contenedor de barras */}
              <div className="absolute left-10 right-0 bottom-10 top-0 flex">
                {emotionalStates.map((state) => (
                  <div key={state.name} className="flex-1 relative flex flex-col items-center">
                    {/* Porcentaje arriba de la barra */}
                    <div
                      className="absolute text-xs font-medium"
                      style={{
                        bottom: `${state.value}%`,
                        transform: 'translateY(-100%)'
                      }}
                    >
                      {state.value}%
                    </div>

                    {/* La barra en sí */}
                    <div
                      className={cn(
                        'absolute bottom-0 w-4 rounded-full',
                        state.isPositive ? 'bg-[#4ADE80]' : 'bg-[#F87171]'
                      )}
                      style={{
                        height: `${state.value}%`,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Nombres debajo del gráfico */}
              <div className="absolute left-10 right-0 bottom-[-48px] h-[80px] flex">
                {emotionalStates.map((state) => (
                  <div key={`label-${state.name}`} className="flex-1 flex justify-center">
                    <div className="h-full flex flex-col items-center relative">
                      <span
                        className="text-xs text-gray-600 absolute top-0 whitespace-nowrap"
                        style={{
                          writingMode: 'vertical-lr',
                          transform: 'rotate(180deg)',
                          textOrientation: 'mixed',
                          lineHeight: '1'
                        }}
                      >
                        {state.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clusters en columna */}
        <div className="w-[280px] space-y-4">
          <Card className="p-4">
            <h3 className="text-base font-semibold mb-3">Clusters that Drivers Long-Term Value</h3>
            {longTermClusters.length > 0 ? (
              <div className="space-y-2.5">
                {longTermClusters.map((cluster) => (
                  <div key={cluster.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{cluster.name}</span>
                    <div className="flex items-center gap-1">
                      {cluster.trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-[#4ADE80]" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-[#F87171]" />
                      )}
                      <span className={cn(
                        'text-sm font-medium',
                        cluster.trend === 'up' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                      )}>
                        {cluster.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="text-base font-semibold mb-3">Clusters that Drives Short-Term Value</h3>
            {shortTermClusters.length > 0 ? (
              <div className="space-y-2.5">
                {shortTermClusters.map((cluster) => (
                  <div key={cluster.name} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{cluster.name}</span>
                    <div className="flex items-center gap-1">
                      {cluster.trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-[#4ADE80]" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-[#F87171]" />
                      )}
                      <span className={cn(
                        'text-sm font-medium',
                        cluster.trend === 'up' ? 'text-[#4ADE80]' : 'text-[#F87171]'
                      )}>
                        {cluster.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No hay datos disponibles</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Card>
  );
}
