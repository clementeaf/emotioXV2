'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { isDevelopmentMode } from '@/lib/utils';

/**
 * Props para el componente DataErrorFallback
 */
export interface DataErrorFallbackProps {
  /** Mensaje de error a mostrar */
  error?: string | Error;
  /** Componente o mensaje a mostrar cuando se han cargado los datos simulados */
  mockComponent?: React.ReactNode;
  /** Función a llamar cuando el usuario decide cargar datos simulados */
  onUseMockData?: () => void;
  /** Función a llamar cuando el usuario intenta recargar los datos reales */
  onRetry?: () => void;
  /** Texto personalizado para el botón de datos simulados */
  mockDataButtonText?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Estilo del contenedor (default, compact, subtle) */
  variant?: 'default' | 'compact' | 'subtle';
  /** Si ya se han cargado los datos simulados */
  mockDataLoaded?: boolean;
}

/**
 * Componente que muestra un mensaje de error cuando falla la carga de datos
 * y ofrece opciones para recargar o usar datos simulados
 */
export function DataErrorFallback({
  error,
  mockComponent,
  onUseMockData,
  onRetry,
  mockDataButtonText = "Usar datos simulados",
  className,
  variant = 'default',
  mockDataLoaded = false
}: DataErrorFallbackProps) {
  const [expanded, setExpanded] = useState(false);
  const isDevMode = isDevelopmentMode();
  
  // Si no hay error o ya se cargaron datos simulados, mostrar solo el componente de datos simulados
  if (mockDataLoaded && mockComponent) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-700 text-sm flex items-center">
            <svg className="w-5 h-5 mr-1.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Mostrando datos simulados</span>
            {onRetry && (
              <button 
                onClick={onRetry} 
                className="ml-auto text-xs px-2 py-1 bg-white border border-amber-200 rounded text-amber-700 hover:bg-amber-100"
              >
                Intentar cargar datos reales
              </button>
            )}
          </p>
        </div>
        {mockComponent}
      </div>
    );
  }

  // Si no hay error, no mostrar nada
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message || 'Error al cargar los datos';
  
  // Determinar clases según la variante
  const containerClasses = cn(
    "overflow-hidden border rounded-lg",
    {
      "bg-red-50 border-red-200 p-4": variant === 'default',
      "bg-red-50 border-red-200 p-3": variant === 'compact',
      "bg-white border-neutral-200 shadow-sm p-4": variant === 'subtle'
    },
    className
  );
  
  const titleClasses = cn(
    "font-medium",
    {
      "text-red-700": variant !== 'subtle',
      "text-neutral-800": variant === 'subtle'
    }
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <p className={titleClasses}>
            <svg className={cn(
              "inline-block mr-1.5",
              {
                "w-5 h-5 text-red-500": variant !== 'subtle',
                "w-5 h-5 text-neutral-400": variant === 'subtle'
              }
            )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Error al cargar datos
          </p>
          {variant !== 'compact' && (
            <button 
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "text-sm hover:underline",
                {
                  "text-red-700 hover:text-red-900": variant !== 'subtle',
                  "text-neutral-500 hover:text-neutral-800": variant === 'subtle'
                }
              )}
            >
              {expanded ? 'Ocultar' : 'Ver'} detalles
            </button>
          )}
        </div>
        
        {expanded && (
          <div className={cn(
            "mt-3 text-sm space-y-2 p-3 rounded",
            {
              "bg-red-100 text-red-800": variant !== 'subtle',
              "bg-neutral-50 text-neutral-700 border border-neutral-100": variant === 'subtle'
            }
          )}>
            <p className="font-medium">Mensaje de error:</p>
            <pre className="whitespace-pre-wrap text-xs p-2 bg-white bg-opacity-50 rounded border border-red-200 overflow-auto max-h-32">
              {errorMessage}
            </pre>
          </div>
        )}
        
        <div className={cn("flex flex-wrap gap-2", {
          "mt-4": variant !== 'compact',
          "mt-2": variant === 'compact'
        })}>
          {onRetry && (
            <Button
              onClick={onRetry}
              size="sm"
              variant={variant === 'subtle' ? 'default' : 'outline'}
              className={variant !== 'subtle' ? 'bg-white hover:bg-red-50' : ''}
            >
              Reintentar
            </Button>
          )}
          
          {isDevMode && onUseMockData && (
            <Button
              onClick={onUseMockData}
              size="sm"
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              {mockDataButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 