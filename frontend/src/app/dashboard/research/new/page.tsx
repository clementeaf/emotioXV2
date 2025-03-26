'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { Button } from '@/components/ui/Button';
import { useResearch } from '@/providers/ResearchProvider';
import { ResearchConfirmation } from '@/components/research/ResearchConfirmation';
import { ResearchStageManager } from '@/components/research/ResearchStageManager';
import { useAuth } from '@/providers/AuthProvider';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onNew: () => void;
}

function ConfirmationModal({ isOpen, onClose, onContinue, onNew }: ConfirmationModalProps) {
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
}

interface DraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onNew: () => void;
}

function DraftContinuationModal({ isOpen, onClose, onContinue, onNew }: DraftModalProps) {
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
}

// Componente que usa useSearchParams
function NewResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const step = searchParams?.get('step') || 'create';
  const [successData, setSuccessData] = useState<{id: string, name: string} | null>(null);
  
  // Función para manejar creación exitosa
  const handleSuccess = (id: string, name: string) => {
    setSuccessData({ id, name });
    router.push(`/dashboard/research/new?step=success&id=${id}`);
  };
  
  // Determinar el contenido basado en el paso actual
  const renderContent = () => {
    if (step === 'create') {
      return (
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-neutral-900">
                Nueva Investigación
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                Configura los detalles de tu nueva investigación
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <CreateResearchForm onResearchCreated={handleSuccess} />
            </div>
          </div>
        </div>
      );
    } else if (step === 'success' && searchParams?.get('id')) {
      const id = searchParams.get('id') || '';
      return (
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
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
                researchName={successData?.name || 'Nueva Investigación'}
                onClose={() => router.push(`/dashboard?research=${id}`)} 
              />
            </div>
          </div>
        </div>
      );
    } else if (step === 'stages' && searchParams?.get('id')) {
      const id = searchParams.get('id') || '';
      return (
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
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
      );
    } else {
      return (
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            <div className="p-6 bg-red-50 rounded-lg border border-red-200">
              <h2 className="text-xl font-medium text-red-800 mb-2">Paso no válido</h2>
              <p className="text-red-700">
                El paso especificado no es válido. Por favor, regresa al 
                <button 
                  onClick={() => router.push('/dashboard/research/new')}
                  className="ml-1 text-red-800 underline hover:text-red-900"
                >
                  inicio del proceso
                </button>.
              </p>
            </div>
          </div>
        </div>
      );
    }
  };
  
  return renderContent();
}

// Usar el HOC para envolver el componente
const NewResearchContentWithSuspense = withSearchParams(NewResearchContent);

export default function NewResearchPage() {
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
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <ErrorBoundary>
          <Suspense fallback={<div className="p-6 text-center">Cargando...</div>}>
            <NewResearchContentWithSuspense />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
} 