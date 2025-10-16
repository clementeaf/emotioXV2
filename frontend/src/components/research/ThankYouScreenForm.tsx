'use client';




import { ThankYouScreenFormData } from '@/types';



import { ThankYouScreenForm as ModularThankYouScreenForm } from './ThankYouScreen';

interface ThankYouScreenFormProps {
  className?: string;
  researchId: string;
  onSave?: () => void;
}

/**
 * Componente de redirección para mantener compatibilidad con el código existente
 * Este componente simplemente redirige al nuevo componente modular
 */
export function ThankYouScreenForm({ className, researchId, onSave }: ThankYouScreenFormProps) {
  // Usar la versión modular refactorizada
  return (
    <ModularThankYouScreenForm 
      className={className}
      researchId={researchId}
      onSave={onSave}
    />
  );
} 