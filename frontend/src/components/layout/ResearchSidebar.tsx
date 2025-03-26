'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { ResearchSidebarProps, ResearchSection } from '@/interfaces/research';
import { cn } from '@/lib/utils';
import { withSearchParams } from '@/components/common/SearchParamsWrapper';
import { Button } from '@/components/ui/Button';
import { researchAPI } from '@/lib/api';

const sections: ResearchSection[] = [
  {
    id: 'build',
    title: 'Build',
    stages: [
      { id: 'welcome-screen', title: 'Welcome Screen' },
      { id: 'smart-voc', title: 'Smart VOC' },
      { id: 'cognitive', title: 'Cognitive Tasks' },
      { id: 'eye-tracking', title: 'Eye Tracking' },
      { id: 'thank-you', title: 'Thank You Screen' }
    ]
  },
  {
    id: 'recruit',
    title: 'Recruit',
    stages: [
      { id: 'configuration', title: 'Configuration' },
      { id: 'participants', title: 'Participants' }
    ]
  },
  {
    id: 'results',
    title: 'Results',
    stages: [
      { id: 'overview', title: 'Overview' },
      { id: 'analytics', title: 'Analytics' },
      { id: 'export', title: 'Export' }
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
      try {
        if (researchId) {
          const response = await researchAPI.get(researchId);
          if (response && response.data && response.data.data) {
            setResearchName(response.data.data.name);
          }
        }
      } catch (error) {
        console.error('Error al obtener el nombre de la investigación:', error);
      }
    };
    
    fetchResearchName();
  }, [researchId]);
  
  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className={cn('w-64 bg-white border-r border-neutral-200 flex flex-col h-full shadow-sm', className)}>
      {/* Header del sidebar */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-neutral-900 truncate" title={researchName}>
            {researchName}
          </h2>
        </div>
        <Button 
          variant="outline" 
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
export function ResearchSidebar(props: ResearchSidebarProps) {
  return (
    <Suspense fallback={<div className="w-64 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-4 text-center text-neutral-600">Cargando...</div>
    </div>}>
      <ResearchSidebarContentWithSuspense {...props} />
    </Suspense>
  );
} 