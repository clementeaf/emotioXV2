'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { BenchmarkChart } from '@/components/clients/BenchmarkChart';
import { BestPerformer } from '@/components/clients/BestPerformer';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { ResearchList } from '@/components/clients/ResearchList';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { SearchParamsWrapper } from '@/components/common/SearchParamsWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { ClientResearch } from '@/interfaces/research';
import { researchAPI } from '@/lib/api';

// Componente para la sección de ayuda
const HelpSection = () => (
  <div className="bg-white rounded-lg p-6 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
    <h3 className="text-base font-medium text-neutral-900 mb-4">
      How to understand this...
    </h3>
    <p className="text-sm text-neutral-600">
      This benchmark helps to understand the relationship between Visual 
      Attractiveness and Benefit Association in your designs. The higher 
      the score in both dimensions, the better the design performs.
    </p>
  </div>
);

// Componente principal de contenido
const ClientsContent = () => {
  const searchParams = useSearchParams();
  const clientId = searchParams?.get('clientId');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clientId || null);
  
  // Actualizar el clientId seleccionado cuando cambia en la URL
  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  // Adaptador para convertir datos de Research a ClientResearch
  const adaptResearchData = (data: unknown[]): ClientResearch[] => {
    return data.map((item: any) => ({
      id: item.id,
      name: item.name || item.basic?.name || 'Untitled Research',
      status: mapStatus(item.status),
      progress: item.progress || 0,
      date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown',
      researcher: 'Team Member' // Valor por defecto ya que no tenemos esta info en la API
    }));
  };

  // Mapear estados de investigación al formato requerido por ClientResearch
  const mapStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
    switch (status) {
      case 'draft':
        return 'pending';
      case 'in-progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  // Obtener datos de investigación desde la API
  const { data: apiResearchData, isLoading: isLoadingResearch } = useQuery({
    queryKey: ['research', selectedClientId],
    queryFn: async () => {
      try {
        const response = await researchAPI.list();
        // Filtrar por cliente si hay un clientId seleccionado
        const research = response.data || [];
        return selectedClientId 
          ? research.filter((item: any) => item.enterprise === selectedClientId || 
                                    item.basic?.enterprise === selectedClientId)
          : research;
      } catch (error) {
        // Error al cargar investigaciones
        return [];
      }
    },
    enabled: true // Siempre cargar los datos
  });

  // Adaptar datos al formato ClientResearch
  const researchData = useMemo(() => {
    return adaptResearchData(apiResearchData || []);
  }, [apiResearchData, adaptResearchData]);

  // Calcular la mejor investigación basada en puntuación
  const bestResearch = useMemo(() => {
    if (!apiResearchData || apiResearchData.length === 0) {
      return null;
    }
    
    // Ordenar por progreso como aproximación de puntuación
    const sorted = [...apiResearchData].sort((a: any, b: any) => 
      (b.progress || 0) - (a.progress || 0)
    );
    
    const best = sorted[0];
    if (!best) {
      return null;
    }
    
    return {
      id: best.id,
      title: best.name || best.basic?.name || 'Untitled Research',
      imageUrl: '',
      score: best.progress || 0,
      researchId: best.id
    };
  }, [apiResearchData]);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar fijo */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Contenido principal con scroll interno si es necesario */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Contenedor principal con scroll */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {/* Header con selector de cliente */}
            <div className="mb-6">
              <ClientSelector onClientChange={handleClientChange} />
            </div>

            {/* Estado de carga */}
            {isLoadingResearch && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Grid principal */}
            {!isLoadingResearch && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Gráfico de benchmark y lista de investigación */}
                <div className="lg:col-span-2 space-y-6">
                  <BenchmarkChart />
                  <ResearchList data={researchData} />
                </div>

                {/* Sidebar derecho */}
                <div className="space-y-6">
                  <HelpSection />
                  {bestResearch && <BestPerformer data={bestResearch} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ClientsPage() {
  const { token } = useProtectedRoute();
  
  if (!token) {
    return null;
  }
  
  return (
    <ErrorBoundary>
      <SearchParamsWrapper>
        <ClientsContent />
      </SearchParamsWrapper>
    </ErrorBoundary>
  );
} 
