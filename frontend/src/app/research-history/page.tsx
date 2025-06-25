'use client';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Sidebar } from '@/components/layout/Sidebar';
import { ClientInfo } from '@/components/research-history/ClientInfo';
import { ClientSelector } from '@/components/research-history/ClientSelector';
import { PerceivedValueChart } from '@/components/research-history/PerceivedValueChart';
import { ResearchList } from '@/components/research-history/ResearchList';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { useSearchParams } from 'next/navigation';
import { Suspense, memo, useEffect, useState } from 'react';

// Interfaces para tipado
interface ClientData {
  id: string;
  name: string;
}

// Componente para la sección de valor percibido
const ValueChartSection = memo(() => (
  <div className="col-span-8">
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
      <h2 className="text-base font-medium text-neutral-900 mb-4">Research&apos;s History</h2>
      <PerceivedValueChart />
    </div>
  </div>
));

ValueChartSection.displayName = 'ValueChartSection';

// Componente para la sección de información del cliente
interface ClientInfoSectionProps {
  client: ClientData | null;
}

const ClientInfoSection = memo(({ client }: ClientInfoSectionProps) => (
  <div className="col-span-4">
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-6">
      <h2 className="text-base font-medium text-neutral-900 mb-4">
        {client ? `Who is ${client.name}` : 'Who is'}
      </h2>
      <ClientInfo />
    </div>
  </div>
));

ClientInfoSection.displayName = 'ClientInfoSection';

// Componente para la lista de investigaciones
interface ResearchListSectionProps {
  clientId: string | null;
}

const ResearchListSection = memo(({ clientId }: ResearchListSectionProps) => (
  <div className="col-span-12">
    <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-100">
        <h2 className="text-base font-medium text-neutral-900">
          {clientId ? `List of Research for Client ${clientId}` : 'List of Research'}
        </h2>
      </div>
      <ResearchList />
    </div>
  </div>
));

ResearchListSection.displayName = 'ResearchListSection';

// Componente para el selector de clientes
const ClientSelectorSection = memo(() => (
  <div className="bg-white rounded-lg shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] p-4">
    <ClientSelector />
  </div>
));

ClientSelectorSection.displayName = 'ClientSelectorSection';

/**
 * Componente que implementa la vista de research history
 * Debe usar useSearchParams, por lo que necesita estar envuelto en Suspense
 */
const ResearchHistoryContent = memo(() => {
  // Usar useSearchParams directamente
  const searchParams = useSearchParams();
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

  // Aquí podemos usar searchParams de forma segura
  const clientParam = searchParams?.get('client');
  const clientId: string | null = clientParam || null;

  // Efecto para cargar datos del cliente cuando cambia el ID
  useEffect(() => {
    if (clientId) {
      console.log('Cliente seleccionado:', clientId);
      // Aquí podríamos hacer una llamada a la API para obtener los datos del cliente
      // Por ahora solo actualizamos el estado con el ID
      setSelectedClient({
        id: clientId,
        name: `Cliente ${clientId}`
      });
    } else {
      setSelectedClient(null);
    }
  }, [clientId]);

  return (
    <div className="space-y-6">
      {/* Client Selector Section */}
      <ClientSelectorSection />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Perceived Value Chart Section */}
        <ValueChartSection />

        {/* Client Info Section */}
        <ClientInfoSection client={selectedClient} />

        {/* Research List Section */}
        <ResearchListSection clientId={clientId} />
      </div>
    </div>
  );
});

ResearchHistoryContent.displayName = 'ResearchHistoryContent';

// Usar el HOC para envolver el componente
const ResearchHistoryContentWithSuspense = withSearchParams(ResearchHistoryContent);

// Componente de carga
const LoadingSpinner = memo(() => (
  <div className="p-4 text-center">
    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em]" role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Cargando...</span>
    </div>
    <p className="mt-2">Cargando datos del historial...</p>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Componente principal de la página
 * Configura el layout básico y usa Suspense para envolver ResearchHistoryContent
 */
export default function ResearchHistoryPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <ResearchHistoryContentWithSuspense />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
