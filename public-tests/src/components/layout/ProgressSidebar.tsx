import React from 'react';
import { cn } from '../../lib/utils'; 

// Interfaz para definir la estructura de un paso en la barra de progreso
export interface Step {
  id: string; // Identificador único del paso (puede ser el 'sk' o un UUID)
  name: string; // Nombre descriptivo del paso a mostrar
}

// Props que el componente ProgressSidebar espera recibir
interface ProgressSidebarProps {
  steps: Step[]; // Array de todos los pasos del flujo
  currentStepIndex: number; // Índice del paso actual en el array 'steps'
  onNavigateToStep?: (index: number) => void; // Añadir prop para callback de navegación
  // Podríamos añadir un array de booleanos si el flujo permite saltos o necesita marcar completados de forma no secuencial
  // completedSteps?: boolean[]; 
}

// Paleta de colores para los distintos estados de los pasos (ajustar al tema de la aplicación)
const colors = {
  completed: 'bg-primary-500', // Punto de paso completado
  current: 'bg-primary-700', // Punto de paso actual (puede tener anillo también)
  pending: 'bg-neutral-300', // Punto de paso pendiente
  lineCompleted: 'bg-primary-500', // Línea conectora para pasos completados
  linePending: 'bg-neutral-300', // Línea conectora para pasos pendientes
  ringCurrent: 'ring-primary-500', // Anillo alrededor del punto actual
  textCurrent: 'text-primary-700', // Color de texto para el paso actual
  textCompleted: 'text-neutral-500 line-through', // Color de texto para pasos completados (opcional: tachado)
  textPending: 'text-neutral-600', // Color de texto para pasos pendientes
};

export function ProgressSidebar({ steps, currentStepIndex, onNavigateToStep }: ProgressSidebarProps) {
  console.log("[ProgressSidebar] Steps recibidos:", steps);

  return (
    <nav 
      aria-label="Progreso del estudio" 
      // Estilos base: ancho fijo, altura completa, fondo, padding, borde derecho, flex column, sticky
      className="w-56 md:w-64 h-screen bg-neutral-50 p-4 md:p-6 border-r border-neutral-200 flex flex-col sticky top-0 shrink-0"
    >
        {/* Título opcional de la barra lateral */}
        <h2 className="text-lg font-semibold mb-6 text-neutral-800 hidden md:block">Progreso</h2> 
        
        {/* Contenedor principal para los pasos, relativo para posicionar las líneas */}
        <div className="relative flex-grow overflow-y-auto -mr-4 pr-4 md:-mr-6 md:pr-6"> {/* Permitir scroll si hay muchos pasos */}
            {steps.map((step, index) => {
                // Determinar el estado de cada paso
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isPending = index > currentStepIndex;
                const isClickable = isCompleted && !!onNavigateToStep;

                // Seleccionar colores y estilos basados en el estado
                const dotColor = isCompleted ? colors.completed : isCurrent ? colors.current : colors.pending;
                const lineColor = isCompleted ? colors.lineCompleted : colors.linePending;
                const textColor = isCurrent ? colors.textCurrent : isCompleted ? colors.textCompleted : colors.textPending;
                
                return (
                    <div
                        key={step.id}
                        className={cn(
                            "relative flex items-start w-full text-left mb-4 pb-4 last:mb-0 last:pb-0",
                            isClickable && "cursor-pointer group",
                            !isClickable && "cursor-default"
                        )}
                        onClick={isClickable ? () => onNavigateToStep(index) : undefined}
                        role={isClickable ? "button" : undefined}
                        tabIndex={isClickable ? 0 : undefined}
                    >
                        {/* Línea vertical conectora (no se muestra para el último paso) */}
                        {index < steps.length - 1 && (
                            <div 
                                className={cn(
                                    // Posicionamiento absoluto, centrado con el punto, altura calculada
                                    "absolute left-[7px] top-[22px] bottom-[-22px] w-0.5", // Ajustar left/top/bottom si cambia tamaño del punto/espaciado
                                    lineColor
                                )} 
                                aria-hidden="true"
                            />
                        )}

                        {/* Punto indicador del paso */}
                        <div className="flex-shrink-0 relative z-10">
                             <div 
                                className={cn(
                                    "w-4 h-4 rounded-full transition-colors duration-300", 
                                    dotColor,
                                    // Añadir anillo para el paso actual
                                    isCurrent && `ring-2 ring-offset-2 ${colors.ringCurrent} ${colors.current}`,
                                    // Efecto hover en el punto si es clickable
                                    isClickable && "group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-primary-300"
                                )}
                                // Atributo ARIA para accesibilidad
                                aria-current={isCurrent ? 'step' : undefined}
                             />
                        </div>

                        {/* Nombre del paso */}
                        <div className="ml-3 md:ml-4">
                            <span 
                                className={cn(
                                    "text-sm font-medium transition-colors duration-300", 
                                    textColor,
                                    // Efecto hover en texto si es clickable
                                    isClickable && "group-hover:text-primary-600"
                                )}
                            >
                                {step.name}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    </nav>
  );
} 