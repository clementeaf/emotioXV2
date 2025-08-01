'use client';

import { useState } from 'react';

export interface PreferenceTestData {
  question: string;
  description?: string;
  options: {
    id: string;
    name: string;
    image?: string;
    selected: number;
    percentage: number;
    color?: string;
  }[];
  totalSelections: number;
  totalParticipants: number;
  responseTime?: string;
  preferenceAnalysis?: string;
  mostPreferred?: string;
  leastPreferred?: string;
}

interface PreferenceTestResultsProps {
  data: PreferenceTestData;
}

export function PreferenceTestResults({ data }: PreferenceTestResultsProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  // Verificar que los datos sean válidos
  if (!data || !data.options || !Array.isArray(data.options)) {
    console.error('[PreferenceTestResults] ❌ Datos inválidos:', data);
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No hay datos de preferencias disponibles.</p>
      </div>
    );
  }

  const {
    question,
    description,
    options,
    totalSelections,
    totalParticipants,
    responseTime,
  } = data;

  // Función para extraer el nombre de la opción de manera segura
  const extractOptionName = (option: any): string => {
    if (typeof option.name === 'string') {
      return option.name;
    } else if (typeof option.name === 'object' && option.name !== null) {
      return option.name.name ||
        option.name.text ||
        option.name.label ||
        option.name.value ||
        option.name.title ||
        JSON.stringify(option.name);
    } else {
      return String(option.name || 'Opción sin nombre');
    }
  };

  // Calcular tiempo promedio por step (simulado basado en selecciones)
  const calculateStepTime = (selected: number, total: number): string => {
    if (total === 0) return '0s';
    const baseTime = 30; // tiempo base en segundos
    const timePerSelection = baseTime / total;
    const stepTime = Math.round(selected * timePerSelection + Math.random() * 20);
    return `${stepTime}s`;
  };

  // Función para alternar la expansión de un step
  const toggleStepExpansion = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="p-6">
      {/* Header con título y tags */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
              Navigation Test
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
              Conditionality disabled
            </span>
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">
              Required
            </span>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
            </button>
          </div>
        </div>

        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}
      </div>

      {/* Steps Container */}
      <div className="space-y-4">
        {options.map((option, index) => {
          const stepNumber = index + 1;
          const stepTime = calculateStepTime(option.selected, totalSelections);
          const isExpanded = expandedStep === option.id;

          return (
            <div key={option.id || `step-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Step Header */}
              <div className="flex items-center space-x-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border flex-shrink-0">
                  {option.image ? (
                    <img
                      src={option.image}
                      alt={extractOptionName(option)}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-xs">
                        {extractOptionName(option).charAt(0)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <h4 className="text-md font-medium text-gray-900">Step {stepNumber}</h4>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">{stepTime}</span>
                  <span className="text-blue-600 font-medium">100%</span>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-600">{option.selected}</span>
                  </div>
                </div>

                {/* Show Details Button */}
                <button
                  onClick={() => toggleStepExpansion(option.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Preview */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Vista Previa</h5>
                      <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100 border">
                        {option.image ? (
                          <img
                            src={option.image}
                            alt={extractOptionName(option)}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 font-semibold text-lg">
                              {extractOptionName(option).charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Estadísticas</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Selecciones:</span>
                          <span className="text-sm font-medium text-gray-900">{option.selected}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Porcentaje:</span>
                          <span className="text-sm font-medium text-gray-900">{option.percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tiempo promedio:</span>
                          <span className="text-sm font-medium text-gray-900">{stepTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Nombre:</span>
                          <span className="text-sm font-medium text-gray-900">{extractOptionName(option)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Resumen General</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalSelections}</div>
            <div className="text-sm text-gray-600">Total Selecciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
            <div className="text-sm text-gray-600">Participantes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{options.length}</div>
            <div className="text-sm text-gray-600">Opciones</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{responseTime || 'N/A'}</div>
            <div className="text-sm text-gray-600">Tiempo Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}
