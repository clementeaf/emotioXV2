'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { ResearchSidebarProps, ResearchSection } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';
import { cleanResearchFromLocalStorage } from '@/lib/cleanup/localStorageCleanup';

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

  // Obtener nombre de la investigación
  useEffect(() => {
    const fetchResearchName = async () => {
      if (!researchId) {
        console.error("ResearchSidebar: No researchId provided.");
        setResearchName("ID de investigación no encontrado");
        setIsLoading(false);
        // Considerar redirección si un ID es estrictamente necesario aquí
        // router.push('/dashboard'); 
        return;
      }

      setIsLoading(true); // Marcar inicio de carga
      setResearchName('Cargando nombre...'); // Resetear a estado de carga
      let foundName = false;

      try {
        // 1. Intentar obtener los datos desde la API
        const response = await researchAPI.get(researchId);
        const responseData = response?.data as any;
        let nameFromApi: string | null = null;
        
        // Intentar extraer el nombre de posibles estructuras de respuesta
        if (responseData?.data?.name) { 
          nameFromApi = responseData.data.name;
        } else if (responseData?.name) {
          nameFromApi = responseData.name;
        }

        if (nameFromApi) {
          setResearchName(nameFromApi);
          setIsLoading(false);
          foundName = true;
          // Opcional: Guardar en localStorage para caché/fallback
          try {
            localStorage.setItem(`research_${researchId}`, JSON.stringify(responseData?.data || responseData));
          } catch (e) { /* Ignorar errores de localStorage */ }
        } else {
          // Si la API responde pero no hay nombre, forzar fallback
          throw new Error('Nombre no encontrado en la respuesta de la API');
        }

      } catch (apiError: any) {
        // Gestionar errores específicos de la API
        if (apiError?.response?.status === 404 || apiError?.message?.includes('404')) {
          console.warn(`ResearchSidebar: Investigación ${researchId} no encontrada (404).`);
          cleanResearchFromLocalStorage(researchId);
          setResearchName("Investigación no encontrada"); 
          // Mantener redirección para 404
          setTimeout(() => router.push('/dashboard'), 100);
          setIsLoading(false);
          return; // Salir si es 404
        } else {
          // Loguear otros errores de API, pero continuar al fallback
          console.warn('Error al obtener nombre desde API (continuando a fallback):', apiError);
        }
      }

      // 2. Fallback: intentar obtener los datos desde localStorage (solo si la API falló)
      if (!foundName) {
          try {
            const storedResearch = localStorage.getItem(`research_${researchId}`);
            if (storedResearch) {
              const researchData = JSON.parse(storedResearch);
              if (researchData && researchData.name) {
                setResearchName(researchData.name);
                foundName = true;
              } else {
                 console.warn(`ResearchSidebar: Datos inválidos en localStorage para ${researchId}.`);
              }
            } else {
              console.warn(`ResearchSidebar: Investigación ${researchId} no encontrada en localStorage.`);
            }
          } catch (localStorageError) {
            console.error('Error al acceder/parsear localStorage:', localStorageError);
          }
      }
      
      // 3. Estado final si no se encontró nombre
      if (!foundName) {
         setResearchName("Nombre no disponible");
      }
      
      setIsLoading(false); // Marcar fin de carga
    };
    
    fetchResearchName();
  }, [researchId, router]); // Dependencias
  
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