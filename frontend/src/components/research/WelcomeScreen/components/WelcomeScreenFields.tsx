import React from 'react';
import { DEFAULT_WELCOME_SCREEN_CONFIG, ValidationErrors } from '../types';
import { WelcomeScreenData } from '@/services/welcomeScreenService';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

/**
 * Componente para los campos del formulario de pantalla de bienvenida
 * Asegura que los valores nunca sean undefined
 */
interface WelcomeScreenFieldsProps {
  formData: WelcomeScreenData;
  handleChange: (field: keyof WelcomeScreenData, value: any) => void;
  validationErrors: ValidationErrors;
  disabled?: boolean;
}

/**
 * Componente que renderiza los campos del formulario de Welcome Screen.
 */
export const WelcomeScreenFields: React.FC<WelcomeScreenFieldsProps> = ({
  formData,
  handleChange,
  validationErrors,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      {/* Campo Título */}
      <div>
        <label htmlFor="ws-title" className="block text-sm font-medium text-neutral-700 mb-1">Título</label>
        <Input
          id="ws-title"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.title}
          disabled={disabled}
          error={!!validationErrors.title}
          helperText={validationErrors.title}
        />
      </div>

      {/* Campo Mensaje */}
      <div>
        <label htmlFor="ws-message" className="block text-sm font-medium text-neutral-700 mb-1">Mensaje</label>
        <Textarea
          id="ws-message"
          value={formData.message || ''}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.message}
          rows={4}
          disabled={disabled}
          error={!!validationErrors.message}
        />
        {validationErrors.message && (
          <p className="mt-1 text-xs text-red-500">{validationErrors.message}</p>
        )}
      </div>
      
      {/* Campo Texto Botón */}
      <div>
        <label htmlFor="ws-button-text" className="block text-sm font-medium text-neutral-700 mb-1">Texto del Botón de Inicio</label>
        <Input
          id="ws-button-text"
          value={formData.startButtonText || ''}
          onChange={(e) => handleChange('startButtonText', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText}
          disabled={disabled}
          error={!!validationErrors.startButtonText}
          helperText={validationErrors.startButtonText}
        />
      </div>
    </div>
  );
}; 