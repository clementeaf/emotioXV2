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
import { ResearchRecord } from '@/types'; // Importar ResearchRecord

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
      if (!researchId) {
        setResearchName('Investigación no encontrada');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null); // Reset error state on new fetch

      try {
        // La respuesta de researchAPI.get ya es el objeto Research gracias a la configuración de alova
        const response = await researchAPI.get(researchId);
        const researchData = response.data; // Asumiendo que la estructura es { data: Research }
        
        // Acceder directamente al nombre desde researchData
        const nameFromApi = researchData?.name;

        if (nameFromApi) {
          setResearchName(nameFromApi);
          // Guardar la respuesta completa en localStorage sigue siendo útil como caché
          try {
            localStorage.setItem(`research_${researchId}`, JSON.stringify(researchData));
            console.log(`Research data for ${researchId} saved to localStorage.`);
          } catch (storageError) {
            console.error('Failed to save research data to localStorage:', storageError);
            // No lanzar error aquí, sólo loggear. La app puede continuar.
          }
        } else {
          // Si la API devolvió datos pero sin nombre (caso improbable pero posible)
          console.warn(`Research data fetched for ${researchId}, but name is missing. Attempting localStorage.`);
          fetchNameFromLocalStorage();
        }
      } catch (apiError: any) {
        console.warn(`Failed to fetch research name for ${researchId} from API:`, apiError.message);
        setError(`Error al cargar datos (${apiError.message || 'detalle desconocido'})`);
        // Si la API falla, intentar obtener de localStorage como fallback
        fetchNameFromLocalStorage();
      } finally {
        // Asegurarse de que loading se ponga a false incluso si localStorage falla
        // setLoading(false); // Se maneja dentro de fetchNameFromLocalStorage o al final si no se llama
        console.log('[ResearchSidebar] Fetch process finished, setting loading to false.');
        setIsLoading(false);
      }
    };

    const fetchNameFromLocalStorage = () => {
      try {
        const storedData = localStorage.getItem(`research_${researchId}`);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          if (parsedData?.name) {
            setResearchName(parsedData.name);
            console.log(`Research name for ${researchId} retrieved from localStorage.`);
            setIsLoading(false); // Nombre encontrado en localStorage
            return; // Salir temprano
          } else {
             console.warn(`Data found in localStorage for ${researchId}, but name is missing.`);
          }
        } else {
          console.log(`No data found in localStorage for ${researchId}.`);
        }
      } catch (storageError) {
        console.error('Failed to retrieve or parse research data from localStorage:', storageError);
        setError('Error al acceder a datos locales.'); // Informar al usuario del error de localStorage
      }
      // Si no se encontró en localStorage o hubo error, establecer nombre por defecto
      setResearchName('Nombre no disponible');
      setIsLoading(false); // Terminado el intento de carga (API falló, localStorage falló/no encontró)
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