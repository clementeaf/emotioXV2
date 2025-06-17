'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { memo, Suspense, useCallback, useState } from 'react';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { ResearchConfirmation } from '@/components/research/ResearchConfirmation';
import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import { Button } from '@/components/ui/Button';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';

// Tipos para componentes modales
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onNew: () => void;
}

// Componente modal de confirmación memoizado
const ConfirmationModal = memo(({ isOpen, onClose, onContinue, onNew }: ConfirmationModalProps) => {
  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Cabecera con fondo de color */}
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900">
              Investigación en curso detectada
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <p className="text-neutral-700 mb-6 leading-relaxed">
            Ya tienes una investigación en curso activa. Solo puede haber una investigación activa a la vez. ¿Qué deseas hacer?
          </p>

          {/* Botones principales */}
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Ir a la investigación actual</span>
            </Button>

            <Button
              onClick={onNew}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-red-600 border-red-200 hover:bg-red-50"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Reemplazar con nueva</span>
            </Button>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full text-center text-neutral-600 hover:text-neutral-900 text-sm py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

ConfirmationModal.displayName = 'ConfirmationModal';

// Componente modal de borrador memoizado
const DraftContinuationModal = memo(({ isOpen, onClose, onContinue, onNew }: ConfirmationModalProps) => {
  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Cabecera con fondo de color */}
        <div className="bg-amber-50 border-b border-amber-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <h2 className="text-xl font-semibold text-neutral-900">
              Borrador de investigación encontrado
            </h2>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-6 py-5">
          <p className="text-neutral-700 mb-6 leading-relaxed">
            Tienes un borrador de investigación sin completar. ¿Deseas continuar con el borrador existente o iniciar uno nuevo?
          </p>

          {/* Botones principales */}
          <div className="space-y-3">
            <Button
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Continuar con el borrador</span>
            </Button>

            <Button
              onClick={onNew}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Crear nuevo borrador</span>
            </Button>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-neutral-50 border-t border-neutral-200 px-6 py-3">
          <button
            onClick={onClose}
            className="w-full text-center text-neutral-600 hover:text-neutral-900 text-sm py-2"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
});

DraftContinuationModal.displayName = 'DraftContinuationModal';

// Interfaz para los datos de investigación exitosa
interface SuccessData {
  id: string;
  name: string;
}

// Sección de creación de investigación
const CreateSection = memo(({ onResearchCreated }: { onResearchCreated: (id: string, name: string) => void }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-4">
        <h1 className="text-2xl mt-2 font-semibold text-neutral-900">
          Nueva Investigación
        </h1>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <CreateResearchForm onResearchCreated={onResearchCreated} />
      </div>
    </div>
  </div>
));

CreateSection.displayName = 'CreateSection';

// Sección de investigación exitosa
const SuccessSection = memo(({
  id,
  name,
  onClose
}: {
  id: string,
  name: string,
  onClose: () => void
}) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Investigación Creada
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tu investigación ha sido creada exitosamente
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <ResearchConfirmation
          researchId={id}
          researchName={name}
          onClose={onClose}
        />
      </div>
    </div>
  </div>
));

SuccessSection.displayName = 'SuccessSection';

// Sección de configuración de etapas
const StagesSection = memo(({ id }: { id: string }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Configurar Etapas
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Configura las etapas de tu investigación
        </p>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <ResearchStageManager researchId={id} />
      </div>
    </div>
  </div>
));

StagesSection.displayName = 'StagesSection';

// Sección de error
const ErrorSection = memo(({ onNavigateToStart }: { onNavigateToStart: () => void }) => (
  <div className="flex-1 overflow-y-auto mt-4 ml-4 bg-white p-4 rounded-lg border border-neutral-150">
    <div className="mx-auto px-6 py-8">
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <h2 className="text-xl font-medium text-red-800 mb-2">Paso no válido</h2>
        <p className="text-red-700">
          El paso especificado no es válido. Por favor, regresa al
          <button
            onClick={onNavigateToStart}
            className="ml-1 text-red-800 underline hover:text-red-900"
          >
            inicio del proceso
          </button>.
        </p>
      </div>
    </div>
  </div>
));

ErrorSection.displayName = 'ErrorSection';

// Componente que usa useSearchParams
function NewResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const step = searchParams?.get('step') || 'create';
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // Función para manejar creación exitosa
  const handleSuccess = useCallback((id: string, name: string) => {
    setSuccessData({ id, name });
    router.push(`/dashboard/research/new?step=success&id=${id}`);
  }, [router]);

  // Función para navegar al inicio
  const navigateToStart = useCallback(() => {
    router.push('/dashboard/research/new');
  }, [router]);

  // Función para ir al dashboard con la investigación seleccionada
  const handleClose = useCallback(() => {
    if (successData?.id) {
      router.push(`/dashboard?research=${successData.id}`);
    } else if (searchParams?.get('id')) {
      router.push(`/dashboard?research=${searchParams.get('id')}`);
    } else {
      router.push('/dashboard');
    }
  }, [router, successData, searchParams]);

  // Determinar el contenido basado en el paso actual
  if (step === 'create') {
    return <CreateSection onResearchCreated={handleSuccess} />;
  }

  if (step === 'success' && searchParams?.get('id')) {
    const id = searchParams.get('id') || '';
    return (
      <SuccessSection
        id={id}
        name={successData?.name || 'Nueva Investigación'}
        onClose={handleClose}
      />
    );
  }

  if (step === 'stages' && searchParams?.get('id')) {
    const id = searchParams.get('id') || '';
    return <StagesSection id={id} />;
  }

  return <ErrorSection onNavigateToStart={navigateToStart} />;
}

// Usar el HOC para envolver el componente
const NewResearchContentWithSuspense = withSearchParams(NewResearchContent);

export default function NewResearchPage() {
  const { token } = useProtectedRoute();

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col mt-12 pr-7 pb-4">
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<div className="p-4 text-center">Cargando...</div>}>
            <NewResearchContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
