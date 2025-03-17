'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResearch } from '@/providers/ResearchProvider';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { CreateResearchForm } from '@/components/research/CreateResearchForm';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onNew: () => void;
}

function ConfirmationModal({ isOpen, onClose, onContinue, onNew }: ConfirmationModalProps) {
  if (!isOpen) return null;

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
  if (!isOpen) return null;

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

export default function NewResearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasDraft, currentDraft, createDraft, clearDraft } = useResearch();
  const [showModal, setShowModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeResearch, setActiveResearch] = useState<{id: string, name: string, technique?: string} | null>(null);

  // Cargar la investigación activa desde localStorage
  useEffect(() => {
    try {
      const storedList = localStorage.getItem('research_list');
      if (storedList) {
        const researchList = JSON.parse(storedList);
        if (researchList.length > 0) {
          // Obtenemos la investigación más reciente (última en la lista)
          const latestResearch = researchList[researchList.length - 1];
          
          // Verificamos si existe en localStorage para obtener su técnica
          const storedResearch = localStorage.getItem(`research_${latestResearch.id}`);
          let technique = undefined;
          
          if (storedResearch) {
            try {
              const researchData = JSON.parse(storedResearch);
              technique = researchData.technique;
            } catch (err) {
              console.error('Error parsing research data:', err);
            }
          }
          
          // Establecemos la investigación activa con su técnica si está disponible
          setActiveResearch({
            id: latestResearch.id,
            name: latestResearch.name,
            technique: technique || latestResearch.technique
          });
          
          console.log('Investigación activa detectada:', latestResearch.name);
        } else {
          console.log('No se encontró ninguna investigación activa');
          setActiveResearch(null);
        }
      }
    } catch (error) {
      console.error('Error verificando investigación activa:', error);
      setActiveResearch(null);
    }
  }, []);

  // NUEVA FUNCIÓN: Redireccionar automáticamente si existe investigación en curso
  // Si hay una investigación activa y no estamos explícitamente continuando un borrador, 
  // mostrar el modal de investigación en curso
  useEffect(() => {
    if (activeResearch && !searchParams.get('continue')) {
      console.log('Mostrando modal para investigación activa:', activeResearch.name);
      setShowModal(true);
      // Importante: desactivar explícitamente el modal de borrador
      setShowDraftModal(false);
    }
  }, [activeResearch, searchParams]);

  // Mostrar el modal adecuado según el estado (solo para borrador, si no hay investigación activa)
  useEffect(() => {
    if (isInitialLoad && !searchParams.get('continue') && !activeResearch) {
      // Solo si NO hay investigación activa, verificar si hay un borrador
      if (hasDraft) {
        console.log('Mostrando modal de borrador (no hay investigación activa)');
        setShowDraftModal(true);
      } else {
        console.log('No hay investigación activa ni borrador');
      }
    }
    setIsInitialLoad(false);
  }, [activeResearch, hasDraft, isInitialLoad, searchParams]);

  const handleContinue = () => {
    setShowModal(false);
    if (activeResearch) {
      console.log('Redirigiendo a investigación existente:', activeResearch.name, '(ID:', activeResearch.id, ')');
      
      try {
        // Determinar la URL correcta basada en la técnica
        let redirectUrl = `/dashboard?research=${activeResearch.id}`;
        if (activeResearch.technique === 'aim-framework') {
          redirectUrl = `/dashboard?research=${activeResearch.id}&aim=true&section=welcome-screen`;
          console.log('Redirigiendo a AIM Framework:', redirectUrl);
        } else {
          console.log('Redirigiendo a investigación estándar:', redirectUrl);
        }
        
        // Ejecutar la redirección
        router.push(redirectUrl);
      } catch (error) {
        console.error('Error al redirigir a investigación existente:', error);
        // Intentar redirección básica como fallback
        router.push(`/dashboard?research=${activeResearch.id}`);
      }
    } else {
      console.error('Error: Se llamó a handleContinue pero no hay investigación activa');
      router.push('/dashboard');
    }
  };

  const handleNew = () => {
    setShowModal(false);
    
    // Si hay una investigación activa, la eliminamos de la lista de investigaciones recientes
    if (activeResearch) {
      try {
        // En lugar de filtrar la lista, la vaciamos completamente
        // para evitar que aparezcan investigaciones antiguas
        localStorage.setItem('research_list', JSON.stringify([]));
        console.log('Investigación en curso eliminada completamente:', activeResearch.name);
      } catch (error) {
        console.error('Error al reemplazar investigación en curso:', error);
      }
    }

    // Crear nuevo borrador si no existe
    if (!hasDraft) {
      createDraft();
    }
  };

  const handleContinueDraft = () => {
    setShowDraftModal(false);
    router.push(`/dashboard/research/new?continue=true&step=${currentDraft?.step}`);
  };

  const handleNewDraft = () => {
    clearDraft();
    setShowDraftModal(false);
    createDraft();
  };

  const handleClose = () => {
    setShowModal(false);
    setShowDraftModal(false);
    router.push('/dashboard');
  };

  const handleResearchCreated = (researchId: string, researchName: string) => {
    clearDraft();
    router.push(`/dashboard?research=${researchId}`);
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-neutral-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8">
              <div className="mb-8">
                <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-3" aria-label="Breadcrumb">
                  <Link 
                    href="/dashboard" 
                    className="hover:text-neutral-900 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <Link 
                    href="/dashboard/research" 
                    className="hover:text-neutral-900 transition-colors"
                  >
                    Research
                  </Link>
                  <span className="text-neutral-300">/</span>
                  <span className="text-neutral-900">New Research</span>
                </nav>
                <h1 className="text-2xl font-semibold text-neutral-900">
                  Create a new research
                </h1>
                <p className="mt-2 text-neutral-500 text-sm">
                  Follow the steps below to create a new research project. You can save your progress at any time.
                </p>
              </div>

              <CreateResearchForm 
                onResearchCreated={handleResearchCreated}
              />

              <div className="mt-8 text-center">
                <p className="text-sm text-neutral-400">
                  Need help? Check our <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">documentation</a> or <a href="#" className="text-blue-500 hover:text-blue-600 transition-colors">contact support</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <ConfirmationModal
          isOpen={showModal}
          onClose={handleClose}
          onContinue={handleContinue}
          onNew={handleNew}
        />

        <DraftContinuationModal
          isOpen={showDraftModal}
          onClose={handleClose}
          onContinue={handleContinueDraft}
          onNew={handleNewDraft}
        />
      </div>
    </ErrorBoundary>
  );
} 