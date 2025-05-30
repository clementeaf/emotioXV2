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
    
    let dotColor, lineColor, textColor;
  
    if (isCurrent) {
      dotColor = 'bg-primary-600';
      textColor = 'text-primary-900';
      lineColor = isAnswered ? 'bg-green-300' : 'bg-neutral-300';
    } else if (isAnswered) {
      dotColor = 'bg-green-500';
      textColor = 'text-green-800';
      lineColor = 'bg-green-300';
    } else {
      dotColor = 'bg-neutral-300';
      textColor = 'text-neutral-600';
      lineColor = 'bg-neutral-200';
    }

    // Mejorar la lógica de navegación
    const canNavigate = !isCurrent && !!onNavigateToStep && (
      isAnswered || 
      index <= (maxVisitedIndex || 0) ||
      index === 0 // Siempre permitir ir al primer paso (welcome)
    );

    if (typeof step !== 'object' || step === null || !('id' in step) || !('name' in step)) {
      return null;
    }
    
    const stepObj = step as { id: string; name: string };

    const handleClick = () => {
      if (canNavigate && onNavigateToStep) {
        console.log(`Navegando al paso ${index}: ${stepObj.name}`);
        onNavigateToStep(index);
      }
    };

    return (
      <div
        className={cn(
          "relative flex items-start w-full text-left py-3 px-3 rounded-lg transition-all duration-200",
          canNavigate && "cursor-pointer group hover:bg-primary-50 hover:shadow-sm",
          !canNavigate && "cursor-default",
          isCurrent && "bg-primary-100 ring-1 ring-primary-200 shadow-sm"
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
        {/* Línea conectora */}
        {index < totalSteps - 1 && (
          <div
            className={cn(
              "absolute left-[19px] top-[40px] bottom-[-12px] w-0.5 transition-colors duration-300",
              lineColor
            )}
            aria-hidden="true"
          />
        )}
        
        {/* Indicador de estado */}
        <div className="flex-shrink-0 relative z-10 mr-3">
          <div
            className={cn(
              "w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center ring-2 ring-white",
              dotColor,
              isCurrent && "ring-4 ring-primary-200 scale-110",
              canNavigate && "group-hover:scale-105",
              isAnswered && "shadow-md"
            )}
            aria-current={isCurrent ? 'step' : undefined}
          >
            {/* Checkmark para pasos completados */}
            {isAnswered && !isCurrent && (
              <svg 
                className="w-2.5 h-2.5 text-white" 
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
            
            {/* Número del paso para paso actual */}
            {isCurrent && (
              <span className="text-xs font-bold text-white">
                {index + 1}
              </span>
            )}
            
            {/* Punto para pasos pendientes */}
            {!isAnswered && !isCurrent && (
              <div className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
            )}
          </div>
        </div>
        
        {/* Contenido del paso */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-300 leading-tight",
                textColor,
                canNavigate && "group-hover:text-primary-700",
                isCurrent && "font-semibold"
              )}
            >
              {stepObj.name}
            </span>
            
            {/* Badge de estado */}
            {isCurrent && (
              <span className="ml-2 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full font-medium">
                Actual
              </span>
            )}
          </div>
          
          {/* Indicadores de estado */}
          <div className="mt-1 flex items-center">
            {isAnswered && !isCurrent && (
              <div className="flex items-center text-xs text-green-600 font-medium">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Completado
              </div>
            )}
            
            {canNavigate && !isCurrent && !isAnswered && (
              <span className="text-xs text-neutral-500">
                Click para navegar
              </span>
            )}
            
            {!canNavigate && !isCurrent && !isAnswered && (
              <span className="text-xs text-neutral-400">
                Pendiente
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }