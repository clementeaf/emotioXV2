'use client';

import { useState, useEffect } from 'react';
import { isDevelopmentMode, shouldUseSimulatedMode } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

/**
 * Props para el componente DevModeInfo
 */
interface DevModeInfoProps {
  /** Clases CSS adicionales */
  className?: string;
  /** Si mostrar el banner completo o compacto */
  variant?: 'default' | 'compact' | 'floating';
}

/**
 * Componente que muestra información sobre el modo de desarrollo
 * y permite cambiar entre datos reales y simulados
 */
export function DevModeInfo({ 
  className, 
  variant = 'floating' 
}: DevModeInfoProps) {
  const [isSimulated, setIsSimulated] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Verificar si estamos en modo desarrollo
  const isDev = isDevelopmentMode();
  
  useEffect(() => {
    // Solo mostrar en modo desarrollo
    if (!isDev) {
      setIsVisible(false);
      return;
    }
    
    // Inicializar el estado con el valor actual
    setIsSimulated(shouldUseSimulatedMode());
    
    // Leer el valor del localStorage
    const storedValue = localStorage.getItem('use_simulated_api');
    if (storedValue === 'true') {
      setIsSimulated(true);
    } else if (storedValue === 'false') {
      setIsSimulated(false);
    }
  }, [isDev]);
  
  // Si no estamos en modo desarrollo o no es visible, no mostrar nada
  if (!isDev || !isVisible) {
    return null;
  }
  
  // Función para cambiar entre datos reales y simulados
  const toggleSimulatedMode = () => {
    const newValue = !isSimulated;
    setIsSimulated(newValue);
    localStorage.setItem('use_simulated_api', newValue.toString());
    
    // Recargar la página para aplicar los cambios
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  // Clases CSS según la variante
  const containerClasses = `
    ${variant === 'default' ? 'p-4 bg-blue-50 border border-blue-200 rounded-lg' : ''}
    ${variant === 'compact' ? 'p-2 bg-blue-50 border border-blue-200 rounded-md text-sm' : ''}
    ${variant === 'floating' ? 'fixed bottom-4 right-4 p-3 bg-white shadow-lg border border-neutral-200 rounded-lg z-50' : ''}
    ${className || ''}
  `;
  
  return (
    <div className={containerClasses}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-neutral-800 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Modo desarrollo
          </span>
          
          {variant === 'floating' && (
            <button 
              onClick={() => setIsVisible(false)}
              className="text-neutral-400 hover:text-neutral-600 ml-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isSimulated ? "outline" : "default"}
            onClick={toggleSimulatedMode}
            className={isSimulated ? "border-amber-300 text-amber-700" : ""}
          >
            {isSimulated ? "Usando datos simulados" : "Usando datos reales"}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  );
} 