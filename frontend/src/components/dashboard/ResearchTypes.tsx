'use client';

import { ApiClient } from '@/config/api';
import { ResearchTypesProps } from '@/interfaces/research';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface Research {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  technique: string;
}

function ResearchTypesContent() {
  const [researchTypes, setResearchTypes] = useState<string[]>([]);
  const [researchData, setResearchData] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResearchTypes = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('No hay token de autenticación');
          return;
        }

        // Usar el cliente API configurado
        const apiClient = new ApiClient();
        apiClient.setAuthToken(token);

        const data = await apiClient.get('research', 'getAll');

        // Guardar los datos completos
        setResearchData(data.data);

        // Extraer tipos únicos de investigación
        const uniqueTypes = [...new Set(data.data.map((research: Research) => research.technique))];
        setResearchTypes(uniqueTypes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResearchTypes();
  }, []);

  const getTypeDisplayName = (type: string) => {
    const typeNames: { [key: string]: string } = {
      'eye-tracking': 'Eye Tracking',
      'aim-framework': 'AIM Framework',
      'smart-voc': 'Smart VOC',
      'cognitive-task': 'Tarea Cognitiva'
    };
    return typeNames[type] || type;
  };

  const getTypeCount = (type: string) => {
    return researchData.filter((research: Research) => research.technique === type).length;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
        </div>
        <div className="p-6">
          <div className="text-center text-red-500 text-sm">
            Error al cargar los tipos de investigación
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">Tipos de Investigación</h2>
      </div>
      <div className="p-6">
        {researchTypes.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm">
            No hay tipos de investigación disponibles
          </div>
        ) : (
          <div className="space-y-3">
            {researchTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                <span className="text-sm font-medium text-neutral-700">
                  {getTypeDisplayName(type)}
                </span>
                <span className="text-xs text-neutral-500 bg-white px-2 py-1 rounded">
                  {getTypeCount(type)} investigación{getTypeCount(type) !== 1 ? 'es' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ResearchTypes({ className }: ResearchTypesProps) {
  return (
    <ErrorBoundary>
      <div className={className}>
        <ResearchTypesContent />
      </div>
    </ErrorBoundary>
  );
}
