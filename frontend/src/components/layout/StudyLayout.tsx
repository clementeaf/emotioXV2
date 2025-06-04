import { ReactNode, useState } from 'react';
import { StudySidebar } from './StudySidebar';
import { cn } from '@/lib/utils';

interface StudyLayoutProps {
  children: ReactNode;
  researchId?: string;
  activeStage?: string;
  sidebarSteps?: Array<{
    id: string;
    name: string;
    type: string;
    completed?: boolean;
    current?: boolean;
  }>;
  currentStepIndex?: number;
  onNavigateToStep?: (index: number) => void;
  showProgressBar?: boolean;
  className?: string;
}

export function StudyLayout({ 
  children, 
  researchId,
  activeStage,
  sidebarSteps = [],
  currentStepIndex = 0,
  onNavigateToStep,
  showProgressBar = true,
  className 
}: StudyLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <StudySidebar 
        steps={sidebarSteps}
        currentStepIndex={currentStepIndex}
        onNavigateToStep={onNavigateToStep}
        researchId={researchId}
        activeStage={activeStage}
        showProgressBar={showProgressBar}
        isMobileSidebarOpen={isMobileSidebarOpen} 
        setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Progress Bar (opcional en la parte superior) */}
        {showProgressBar && sidebarSteps.length > 0 && (
          <div className="bg-white border-b border-neutral-200 px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-600">
                Progreso del estudio
              </span>
              <span className="text-sm text-neutral-500">
                Paso {currentStepIndex + 1} de {sidebarSteps.length}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${sidebarSteps.length > 0 ? ((currentStepIndex + 1) / sidebarSteps.length) * 100 : 0}%` 
                }} 
              />
            </div>
            {sidebarSteps[currentStepIndex] && (
              <p className="text-sm text-neutral-600 mt-2">
                {sidebarSteps[currentStepIndex].name}
              </p>
            )}
          </div>
        )}
        
        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          // Centrar el contenido tanto horizontal como verticalmente
          "flex items-center justify-center",
          "p-4 sm:p-6 lg:p-8",
          className
        )}>
          <div className="w-full max-w-4xl">
            {children}
          </div>
        </main>
        
        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
} 