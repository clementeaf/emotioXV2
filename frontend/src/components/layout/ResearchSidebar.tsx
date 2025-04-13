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
  const [researchName, setResearchName] = useState<string>('Research Project');
  
  // Obtener nombre de la investigación
  useEffect(() => {
    const fetchResearchName = async () => {
      if (researchId) {
        try {
          // Intentar obtener los datos desde la API
          const response = await researchAPI.get(researchId);
          // Se ajusta la estructuración para evitar errores de tipo
          if (response?.data) {
            // La respuesta puede tener diferentes estructuras, intentar extraer el nombre
            const responseData = response.data as any;
            if (responseData.data && responseData.data.name) {
              setResearchName(responseData.data.name);
            } else if (responseData.name) {
              setResearchName(responseData.name);
            }
            return;
          }
        } catch (apiError: any) {
          // Si es un error 404, no mostramos mensaje en consola, es un caso normal
          // cuando una investigación ha sido eliminada
          if (apiError?.response?.status === 404 || 
              (apiError?.message && apiError.message.includes('404'))) {
            // Para 404, limpiamos los datos en localStorage
            cleanResearchFromLocalStorage(researchId);
            
            // Redireccionar al dashboard después de un breve retraso
            // para dar tiempo a que se complete la limpieza
            setTimeout(() => {
              router.push('/dashboard');
            }, 100);
          } else if (apiError?.response?.status !== 404 && 
              !(apiError?.message && apiError.message.includes('404'))) {
            // Solo mostramos en consola errores que no sean 404
            console.error('Error al obtener el nombre de la investigación desde la API:', apiError);
          }
          
          // Para cualquier error, intentamos usar el fallback
        }
        
        // Fallback: intentar obtener los datos desde localStorage
        try {
          const storedResearch = localStorage.getItem(`research_${researchId}`);
          if (storedResearch) {
            const researchData = JSON.parse(storedResearch);
            if (researchData && researchData.name) {
              setResearchName(researchData.name);
            } else {
              // Si encontramos datos pero no tienen nombre, consideramos que los datos
              // están corruptos y redirigimos al dashboard
              cleanResearchFromLocalStorage(researchId);
              router.push('/dashboard');
            }
          } else {
            // Si no hay datos en localStorage ni en la API, redirigir al dashboard
            router.push('/dashboard');
          }
        } catch (localStorageError) {
          // Error al acceder a localStorage, no mostramos mensaje para no confundir
          // Solo usamos el valor por defecto
        }
      }
    };
    
    fetchResearchName();
  }, [researchId, router]);
  
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className={cn('absolute left-4 top-20 w-58 p-2 rounded-2xl flex flex-col h-min-[510px]', className)} style={{ boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)' }}>
      {/* Header del sidebar */}
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-neutral-900 truncate" title={researchName}>
            {researchName}
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBackToDashboard} 
          className="w-full text-neutral-700 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Volver al dashboard
        </Button>
      </div>
      
      {/* Contenido del sidebar */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-3">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              <div className="px-3">
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