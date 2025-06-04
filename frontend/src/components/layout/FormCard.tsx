import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getFormContainerClass } from '@/utils/formHelpers';

interface FormCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  variant?: 'default' | 'centered' | 'wide';
  className?: string;
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

export function FormCard({ 
  children, 
  title, 
  description, 
  variant = 'centered',
  className,
  showProgress = false,
  currentStep,
  totalSteps 
}: FormCardProps) {
  return (
    <div className={cn(getFormContainerClass(variant), className)}>
      {/* Header del formulario */}
      {(title || description || showProgress) && (
        <div className="mb-8">
          {/* Indicador de progreso */}
          {showProgress && currentStep !== undefined && totalSteps !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                <span>Paso {currentStep} de {totalSteps}</span>
                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                <div 
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }} 
                />
              </div>
            </div>
          )}
          
          {/* Título */}
          {title && (
            <h2 className="text-xl font-medium text-neutral-800 mb-4">
              {title}
            </h2>
          )}
          
          {/* Descripción */}
          {description && (
            <p className="text-sm text-neutral-600 mb-4">
              {description}
            </p>
          )}
        </div>
      )}
      
      {/* Contenido del formulario */}
      {children}
    </div>
  );
} 