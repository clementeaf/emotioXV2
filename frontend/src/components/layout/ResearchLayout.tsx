import { ReactNode } from 'react';
import { ResearchSidebar } from './ResearchSidebar';
import { cn } from '@/lib/utils';
import useResearchIdValidation from '@/lib/custom-hooks/useResearchIdValidation';

interface ResearchLayoutProps {
  children: ReactNode;
  researchId: string;
  activeStage?: string;
  className?: string;
}

export function ResearchLayout({ 
  children, 
  researchId,
  activeStage = 'welcome-screen',
  className 
}: ResearchLayoutProps) {
  // Validar que el ID de investigación existe, 
  // si no, redirigir automáticamente al dashboard
  useResearchIdValidation(researchId);
  
  return (
    <div className="flex h-full w-full">
      <div className="w-72">
        <ResearchSidebar 
          researchId={researchId} 
          activeStage={activeStage} 
        />
      </div>
      <main className={cn("flex-1 overflow-auto bg-neutral-50 p-8", className)}>
        {children}
      </main>
    </div>
  );
} 