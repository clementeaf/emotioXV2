'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { ResearchSidebarProps, ResearchSection } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Research } from '../../../../shared/interfaces/research.model';
import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';
import { cleanResearchFromLocalStorage } from '@/lib/cleanup/localStorageCleanup';
import { ResearchRecord } from '@/types'; // Mantener ResearchRecord si se usa

const sections: ResearchSection[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [
      { id: 'welcome-screen', title: 'Welcome Screen' },
      { id: 'smart-voc', title: 'Smart VOC' },
      { id: 'cognitive', title: 'Cognitive Tasks' },
      { id: 'thank-you', title: 'Thank You Screen' }
    ]
  },
  {
    id: 'recruit',
    title: 'Recruit',
    stages: [
      { id: 'eye-tracking-recruit', title: 'Eye Tracking' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'smart-voc-results', title: 'SmartVOC' },
      { id: 'cognitive-task-results', title: 'Cognitive Task' }
    ]
  }
];

// Componente interno que usa useSearchParams
function ResearchSidebarContent({ researchId, activeStage, className }: ResearchSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = searchParams?.get('section') || 'welcome-screen';
  
  // Estados para el nombre y la carga
  const [researchName, setResearchName] = useState<string>('Cargando nombre...'); // Estado inicial de carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener nombre de la investigación
  useEffect(() => {
    const fetchResearchName = async () => {
      console.log(`[ResearchSidebar] Iniciando fetch para researchId: ${researchId}`);

      if (!researchId) {
        console.warn('[ResearchSidebar] researchId es nulo o indefinido.');
        setResearchName('Investigación no encontrada');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null); 

      try {
        console.log(`[ResearchSidebar] Llamando a researchAPI.list() para obtener todas las investigaciones.`);
        const response = await researchAPI.list(); // Obtiene la lista completa
        console.log('[ResearchSidebar] Respuesta cruda de researchAPI.list():', response);

        const researchList = response.data as Research[]; // Castear a Research[]
        console.log('[ResearchSidebar] researchList extraído (response.data):', researchList);

        const currentResearch = researchList?.find(research => research.id === researchId);
        console.log('[ResearchSidebar] currentResearch encontrado en la lista:', currentResearch);

        const nameFromList = currentResearch?.name;
        console.log(`[ResearchSidebar] nameFromList extraído: ${nameFromList}`);

        if (nameFromList) {
          console.log(`[ResearchSidebar] Nombre "${nameFromList}" encontrado en la lista. Actualizando estado.`);
          setResearchName(nameFromList);
          try {
            localStorage.setItem(`research_${researchId}`, JSON.stringify(currentResearch)); 
            console.log(`[ResearchSidebar] Datos de la investigación actual guardados en localStorage para ${researchId}.`);
          } catch (storageError) {
            console.error('[ResearchSidebar] Falló al guardar en localStorage:', storageError);
          }
        } else {
          console.warn(`[ResearchSidebar] Nombre no encontrado en la lista para ${researchId}. Intentando localStorage (fallback).`);
          fetchNameFromLocalStorage(); // Llama al fallback si no se encontró en la lista
        }
      } catch (apiError: any) {
        console.error(`[ResearchSidebar] Error capturado al llamar a researchAPI.list() para ${researchId}:`, apiError);
        setError(`Error al cargar lista de datos (${apiError.message || 'detalle desconocido'})`);
        fetchNameFromLocalStorage(); // Intenta fallback si la API falla
      } finally {
        console.log('[ResearchSidebar] Bloque finally alcanzado. Estableciendo isLoading a false.');
        setIsLoading(false); 
      }
    };

    const fetchNameFromLocalStorage = () => {
      console.log(`[ResearchSidebar] Intentando obtener nombre desde localStorage para ${researchId}`);
      try {
        const storedData = localStorage.getItem(`research_${researchId}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('[ResearchSidebar] Datos parseados de localStorage:', parsedData);
          if (parsedData?.name) {
            console.log(`[ResearchSidebar] Nombre "${parsedData.name}" encontrado en localStorage.`);
            setResearchName(parsedData.name);
            setError(null);
            return; 
          } else {
             console.warn(`[ResearchSidebar] Datos encontrados en localStorage para ${researchId}, pero sin nombre.`);
          }
        } else {
          console.log(`[ResearchSidebar] No se encontraron datos en localStorage para ${researchId}.`);
        }
      } catch (storageError) {
         console.error('[ResearchSidebar] Error al leer/parsear localStorage:', storageError);
        setError('Error al acceder a datos locales.');
      }
      console.warn('[ResearchSidebar] Fallback final: Nombre no encontrado ni en API ni en localStorage.');
      setResearchName('Nombre no disponible');
    };

    fetchResearchName();
  }, [researchId]);
  
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-xl p-4 mt-4 mx-4 flex flex-col min-h-[510px] border border-neutral-200', className)}>
      {/* Header del sidebar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          {/* Mostrar estado de carga o nombre */}
          <h2 className="text-lg font-semibold text-neutral-900 truncate" title={researchName}>
            {isLoading ? 'Cargando nombre...' : researchName}
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard} 
          className="text-neutral-700 flex items-center justify-start p-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver al dashboard
        </Button>
      </div>
      
      {/* Contenido del sidebar */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-2">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div>
                <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              {section.stages?.map((stage) => (
                <Link
                  key={stage.id}
                  href={`/dashboard?research=${researchId}&aim=true&section=${stage.id}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    currentSection === stage.id
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  )}
                >
                  <span className="flex-1">{stage.title}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

// Usar el HOC para envolver el componente
const ResearchSidebarContentWithSuspense = withSearchParams(ResearchSidebarContent);

// Componente público que exportamos
export function ResearchSidebar({ researchId, activeStage }: ResearchSidebarProps) {
  return (
    <Suspense fallback={<div className="w-60 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <ResearchSidebarContentWithSuspense researchId={researchId} activeStage={activeStage} />
    </Suspense>
  );
} 