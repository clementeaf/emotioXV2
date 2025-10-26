import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FormNavigationProps {
  currentIndex: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
}

/**
 * Navegación fluida para formularios con botones anterior/siguiente
 */
export const FormNavigation: React.FC<FormNavigationProps> = ({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  className = ''
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalItems - 1;
  const currentNumber = currentIndex + 1;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Botón Anterior */}
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${isFirst 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        title={isFirst ? 'Primera pregunta' : 'Pregunta anterior'}
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>

      {/* Indicador de progreso */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="font-medium">{currentNumber}</span>
        <span>de</span>
        <span className="font-medium">{totalItems}</span>
      </div>

      {/* Botón Siguiente */}
      <button
        onClick={onNext}
        disabled={isLast}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${isLast 
            ? 'text-gray-400 cursor-not-allowed' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }
        `}
        title={isLast ? 'Última pregunta' : 'Siguiente pregunta'}
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
