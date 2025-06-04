import { cn } from "../../lib/utils";
import { useParticipantStore } from '../../stores/participantStore';

export function ProgressSidebarItem({ step, index, isCurrent, isAnswered, totalSteps, onNavigateToStep }: {
    step: unknown;
    index: number;
    isCurrent: boolean;
    isAnswered: boolean;
    totalSteps: number;
    onNavigateToStep?: (index: number) => void;
  }) {
    // Obtener el maxVisitedIndex del store para saber hasta dónde puede navegar
    const maxVisitedIndex = useParticipantStore(state => state.maxVisitedIndex);
    
    // Estados simplificados
    let statusColor, textColor, bgColor, lineColor;
  
    if (isCurrent) {
      statusColor = 'bg-neutral-900';
      textColor = 'text-neutral-900';
      bgColor = 'bg-neutral-100';
      lineColor = 'bg-neutral-300';
    } else if (isAnswered) {
      statusColor = 'bg-green-600';
      textColor = 'text-green-800';
      bgColor = 'hover:bg-green-50';
      lineColor = 'bg-green-300';
    } else {
      statusColor = 'bg-neutral-300';
      textColor = 'text-neutral-500';
      bgColor = 'hover:bg-neutral-50';
      lineColor = 'bg-neutral-200';
    }

    // Mejorar la lógica de navegación - Los steps completados siempre deben ser navegables
    const canNavigate = !isCurrent && !!onNavigateToStep && (
      isAnswered ||  // Si está respondido, siempre navegable
      index <= (maxVisitedIndex || 0) || // O si está dentro del máximo visitado
      index === 0 // O si es el primer paso (welcome)
    );

    if (typeof step !== 'object' || step === null || !('id' in step) || !('name' in step)) {
      return null;
    }
    
    const stepObj = step as { id: string; name: string };

    const handleClick = () => {
      
      if (canNavigate && onNavigateToStep) {
        onNavigateToStep(index);
      } else {
        console.warn(`❌ [ProgressSidebarItem] No se puede navegar al paso ${index}:`, {
          canNavigate,
          onNavigateToStep: !!onNavigateToStep,
          reason: !canNavigate ? 'canNavigate es false' : 'onNavigateToStep no existe'
        });
      }
    };

    return (
      <div
        className={cn(
          "group relative flex items-center w-full text-left py-3 px-4 rounded-lg transition-all duration-200",
          canNavigate && "cursor-pointer",
          !canNavigate && "cursor-default",
          bgColor
        )}
        onClick={handleClick}
        role={canNavigate ? "button" : undefined}
        tabIndex={canNavigate ? 0 : undefined}
        onKeyDown={canNavigate ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        } : undefined}
        aria-disabled={!canNavigate}
        aria-label={`${canNavigate ? 'Ir a' : ''} ${stepObj.name}${isCurrent ? ' (paso actual)' : ''}${isAnswered ? ' (completado)' : ''}`}
      >
        {/* Línea conectora minimalista */}
        {index < totalSteps - 1 && (
          <div
            className={cn(
              "absolute left-[11px] top-[32px] bottom-[-4px] w-px transition-colors duration-200",
              lineColor
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Indicador de estado minimalista */}
        <div className="flex-shrink-0 relative z-10 mr-4">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              statusColor,
              isCurrent && "scale-125",
              canNavigate && "group-hover:scale-110"
            )}
            aria-current={isCurrent ? 'step' : undefined}
          />
        </div>
        
        {/* Contenido del paso */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-200 leading-relaxed",
                textColor,
                canNavigate && "group-hover:text-neutral-700",
                isCurrent && "font-semibold"
              )}
            >
              {stepObj.name}
            </span>
            
            {/* Estado actual simplificado */}
            {isCurrent && (
              <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full ml-2" />
            )}
          </div>
          
          {/* Status text minimalista */}
          {isAnswered && !isCurrent && (
            <div className="text-xs text-green-600 mt-0.5 font-medium">
              Completado
            </div>
          )}
        </div>
      </div>
    );
  }