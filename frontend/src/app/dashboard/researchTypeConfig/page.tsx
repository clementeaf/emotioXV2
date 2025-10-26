'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StudyConfig } from '@/components/research/StudyConfig';
import { useGlobalResearchData } from '@/hooks/useGlobalResearchData';

export default function ResearchTypeConfigPage() {
  const searchParams = useSearchParams();
  const researchId = searchParams?.get('research') || '';
  const { researchData, isLoading } = useGlobalResearchData(researchId);
  
  const [config, setConfig] = useState({
    technique: '',
    eyeTracking: {
      enabled: false,
      parameters: {
        saveResponseTimes: false,
        saveUserJourney: false,
        showProgressBar: true
      }
    },
    smartVOC: {
      enabled: false,
      questions: []
    },
    cognitiveTasks: {
      enabled: false,
      tasks: []
    },
    demographics: {
      enabled: false,
      questions: []
    }
  });

  useEffect(() => {
    if (researchData) {
      setConfig({
        technique: researchData.technique || '',
        eyeTracking: {
          enabled: (researchData as any).eyeTracking?.enabled || false,
          parameters: {
            saveResponseTimes: (researchData as any).eyeTracking?.parameterOptions?.saveResponseTimes || false,
            saveUserJourney: (researchData as any).eyeTracking?.parameterOptions?.saveUserJourney || false,
            showProgressBar: (researchData as any).eyeTracking?.linkConfig?.showProgressBar ?? true
          }
        },
        smartVOC: {
          enabled: (researchData as any).smartVOC?.enabled || false,
          questions: (researchData as any).smartVOC?.questions || []
        },
        cognitiveTasks: {
          enabled: (researchData as any).cognitiveTasks?.enabled || false,
          tasks: (researchData as any).cognitiveTasks?.tasks || []
        },
        demographics: {
          enabled: (researchData as any).demographics?.enabled || false,
          questions: (researchData as any).demographics?.questions || []
        }
      });
    }
  }, [researchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Cargando configuración...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración de Investigación</h1>
        <p className="text-gray-600 mt-1">
          {researchData?.name || 'Sin nombre'} - {researchData?.technique || 'Sin técnica'}
        </p>
      </div>

      {/* Usar el nuevo sistema híbrido */}
      <StudyConfig
        researchId={researchId}
        initialData={config}
        onSave={(data) => {
          console.log('Guardando configuración:', data);
          // Aquí iría la llamada a la API para guardar la configuración
        }}
        estimatedCompletionTime="10-15"
      />
    </div>
  );
}