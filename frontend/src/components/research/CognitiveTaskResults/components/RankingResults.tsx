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

export function RankingResults({ data }: RankingResultsProps) {
  // Ordenar las opciones por media (de mayor a menor)
  const sortedOptions = [...data.options].sort((a, b) => b.mean - a.mean);

  // Obtener el valor máximo de distribución para normalizar las alturas
  const getMaxDistribution = () => {
    let max = 0;
    for (const option of data.options) {
      for (let i = 1; i <= 6; i++) {
        if (option.distribution[i as keyof RankingDistribution] > max) {
          max = option.distribution[i as keyof RankingDistribution];
        }
      }
    }
    return max;
  };

  const maxDistribution = getMaxDistribution();

  // Calcular la altura de cada barra en el histograma (como porcentaje del máximo)
  const getBarHeight = (value: number) => {
    return value > 0 ? `${(value / maxDistribution) * 100}%` : '0%';
  };

  return (
    <div className="w-full">
      {/* Encabezado con números */}
      <div className="grid grid-cols-[200px_repeat(6,1fr)_120px_120px] gap-2 px-4 py-2 border-b border-neutral-200">
        <div></div>
        {[1, 2, 3, 4, 5, 6].map(num => (
          <div key={num} className="text-center font-medium text-neutral-700">
            {num}
          </div>
        ))}
        <div className="text-center font-medium text-neutral-700">Mean</div>
        <div className="text-center font-medium text-neutral-700">Secs</div>
      </div>

      {/* Filas para cada opción */}
      {sortedOptions.map((option) => (
        <div
          key={option.id}
          className="grid grid-cols-[200px_repeat(6,1fr)_120px_120px] gap-2 px-4 py-4 border-b border-neutral-200 hover:bg-neutral-50"
        >
          {/* Nombre de la opción */}
          <div className="font-medium text-neutral-700 flex items-center">
            {option.text}
          </div>

          {/* Distribución de puntuación (1-6) */}
          {[1, 2, 3, 4, 5, 6].map(num => (
            <div key={num} className="flex items-end justify-center h-[60px]">
              <div
                className="w-[70%] bg-blue-300 rounded-sm"
                style={{
                  height: getBarHeight(option.distribution[num as keyof RankingDistribution])
                }}
              ></div>
            </div>
          ))}

          {/* Media */}
          <div className="text-center font-medium text-neutral-800 flex items-center justify-center">
            {option.mean.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).replace('.', ',')}
          </div>

          {/* Tiempo de respuesta */}
          <div className="text-center text-neutral-500 flex items-center justify-center">
            <span>{option.responseTime}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
