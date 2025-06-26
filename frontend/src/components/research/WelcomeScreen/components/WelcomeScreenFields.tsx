import React from 'react';

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { WelcomeScreenData } from '@/services/welcomeScreenService';

import { DEFAULT_WELCOME_SCREEN_CONFIG, ValidationErrors } from '../types';

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
        <Input
          id="welcome-screen-title"
          name="welcome-screen-title"
          label="Título"
          value={formData.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.title}
          disabled={disabled}
          error={!!validationErrors.title}
          helperText={validationErrors.title}
          autoComplete="off"
        />
      </div>

      {/* Campo Mensaje */}
      <div>
        <Textarea
          id="welcome-screen-message"
          name="welcome-screen-message"
          label="Mensaje"
          value={formData.message || ''}
          onChange={(e) => handleChange('message', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.message}
          rows={4}
          disabled={disabled}
          error={!!validationErrors.message}
          helperText={validationErrors.message}
          autoComplete="off"
        />
      </div>
      
      {/* Campo Texto Botón */}
      <div>
        <Input
          id="welcome-screen-button-text"
          name="welcome-screen-button-text"
          label="Texto del Botón de Inicio"
          value={formData.startButtonText || ''}
          onChange={(e) => handleChange('startButtonText', e.target.value)}
          placeholder={DEFAULT_WELCOME_SCREEN_CONFIG.startButtonText}
          disabled={disabled}
          error={!!validationErrors.startButtonText}
          helperText={validationErrors.startButtonText}
          autoComplete="off"
        />
      </div>
    </div>
  );
}; 