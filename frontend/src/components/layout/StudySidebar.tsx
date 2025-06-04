import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { getProgressPercentage } from '@/utils/formHelpers';

interface Step {
  id: string;
  name: string;
  type: string;
  completed?: boolean;
  current?: boolean;
}

interface StudySidebarProps {
  steps: Step[];
  currentStepIndex: number;
  onNavigateToStep?: (index: number) => void;
  researchId?: string;
  activeStage?: string;
  showProgressBar?: boolean;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
}

interface SidebarItemProps {
  step: Step;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  onNavigateToStep?: (index: number) => void;
  canNavigate: boolean;
}

function SidebarItem({ 
  step, 
  index, 
  isCurrent, 
  isCompleted, 
  onNavigateToStep,
  canNavigate 
}: SidebarItemProps) {
  const handleClick = () => {
    if (canNavigate && onNavigateToStep) {
      onNavigateToStep(index);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex items-center px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
        canNavigate ? "cursor-pointer" : "cursor-default",
        isCurrent 
          ? "bg-indigo-600 text-white shadow-sm" 
          : isCompleted
            ? "bg-green-50 text-green-800 hover:bg-green-100"
            : "text-neutral-600 hover:bg-neutral-100",
        !canNavigate && "opacity-50"
      )}
    >
      {/* Icono de estado */}
      <div className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-3 shrink-0",
        isCurrent
          ? "bg-white text-indigo-600"
          : isCompleted
            ? "bg-green-600 text-white"
            : "bg-neutral-200 text-neutral-500"
      )}>
        {isCompleted ? (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Nombre del paso */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isCurrent ? "text-white" : isCompleted ? "text-green-800" : "text-neutral-700"
        )}>
          {step.name}
        </p>
        <p className={cn(
          "text-xs truncate mt-0.5",
          isCurrent ? "text-indigo-100" : isCompleted ? "text-green-600" : "text-neutral-500"
        )}>
          {step.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </p>
      </div>

      {/* Indicador de navegación */}
      {canNavigate && !isCurrent && (
        <div className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "text-xs",
          isCompleted ? "text-green-600" : "text-neutral-400"
        )}>
          →
        </div>
      )}
    </div>
  );
}

export function StudySidebar({ 
  steps, 
  currentStepIndex, 
  onNavigateToStep,
  researchId,
  showProgressBar = true,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen 
}: StudySidebarProps) {
  
  // Calcular progreso
  const progressInfo = useMemo(() => {
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const percentage = getProgressPercentage(completedSteps, totalSteps);
    
    return {
      completedSteps,
      totalSteps,
      percentage
    };
  }, [steps]);

  const showCounter = progressInfo.totalSteps > 0;

  return (
    <>
      {/* Sidebar */}
      <nav 
        aria-label="Progreso del estudio"
        className={cn(
          "w-64 h-screen flex flex-col shrink-0 bg-white border-r border-neutral-200",
          "fixed lg:relative z-50 transition-transform duration-300 ease-in-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="px-6 py-6 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-800 uppercase tracking-wide">
              Progreso
            </h2>
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-neutral-100"
            >
              <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {showCounter && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600">Completado</span>
                <span className="font-mono text-neutral-800 bg-neutral-100 px-2 py-1 rounded">
                  {progressInfo.completedSteps}/{progressInfo.totalSteps}
                </span>
              </div>
              
              {showProgressBar && (
                <div className="space-y-1">
                  <div className="w-full bg-neutral-200 rounded-full h-1.5">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progressInfo.percentage}%` }} 
                    />
                  </div>
                  <div className="text-xs text-neutral-500 font-mono text-center">
                    {progressInfo.percentage}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Lista de pasos */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {steps.map((step, index) => (
            <SidebarItem
              key={`${step.id}-${index}`}
              step={step}
              index={index}
              isCurrent={index === currentStepIndex}
              isCompleted={step.completed || false}
              onNavigateToStep={onNavigateToStep}
              canNavigate={step.completed || index <= currentStepIndex}
            />
          ))}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-100">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>ID:</span>
            <span className="bg-neutral-100 px-2 py-1 rounded text-neutral-600">
              {researchId?.slice(-6) || 'N/A'}
            </span>
          </div>
        </div>
      </nav>
    </>
  );
} 