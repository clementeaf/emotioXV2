'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { BenchmarkChart } from '@/components/clients/BenchmarkChart';
import { BestPerformer } from '@/components/clients/BestPerformer';
import { ClientSelector } from '@/components/clients/ClientSelector';
import { ResearchList } from '@/components/clients/ResearchList';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { SearchParamsWrapper } from '@/components/common/SearchParamsWrapper';
import { useAuth } from '@/providers/AuthProvider';

// Mock data para demostración
const mockResearch = [
  {
    id: '1',
    name: 'Eye Tracking Study #1',
    status: 'completed' as const,
    progress: 100,
    date: '2024-02-20',
    researcher: 'John Doe'
  },
  {
    id: '2',
    name: 'Visual Attention Analysis',
    status: 'in_progress' as const,
    progress: 65,
    date: '2024-02-25',
    researcher: 'Jane Smith'
  }
];

const mockBestPerformer = {
  id: '1',
  title: 'Product Design A',
  imageUrl: '/placeholder.jpg',
  score: 95,
  researchId: '1'
};

function ClientsContent() {
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
    // Aquí se cargarían los datos del cliente seleccionado
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar fijo */}
      <Sidebar className="w-64 flex-shrink-0" />

      {/* Contenido principal con scroll interno si es necesario */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar fijo */}
        <Navbar />
        
        {/* Contenedor principal con scroll */}
        <div className="flex-1 overflow-auto">
          <div className="h-full p-6">
            {/* Header con selector de cliente */}
            <div className="mb-6">
              <ClientSelector onClientChange={handleClientChange} />
            </div>

            {/* Grid principal */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gráfico de benchmark y lista de investigación */}
              <div className="lg:col-span-2 space-y-6">
                <BenchmarkChart />
                <ResearchList data={mockResearch} />
              </div>

              {/* Sidebar derecho */}
              <div className="space-y-6">
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
                <BestPerformer data={mockBestPerformer} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);
  
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