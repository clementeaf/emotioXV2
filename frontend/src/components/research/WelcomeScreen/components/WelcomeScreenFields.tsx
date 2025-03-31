import React from 'react';
import { WelcomeScreenFieldsProps, DEFAULT_WELCOME_SCREEN_CONFIG } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para los campos del formulario de pantalla de bienvenida
 * Asegura que los valores nunca sean undefined
 */
export const WelcomeScreenFields: React.FC<WelcomeScreenFieldsProps> = ({
  formData,
  onChange,
  validationErrors = {}, // Valor por defecto para evitar errores
  disabled = false // Valor por defecto para evitar errores
}) => {
  // Asegurarnos de que formData siempre tenga valores definidos
  const safeFormData = {
    ...DEFAULT_WELCOME_SCREEN_CONFIG,
    ...formData
  };
  
  // Manejar cambios de forma segura
  const handleChange = (field: keyof typeof safeFormData, value: any) => {
    if (onChange) {
      onChange(field, value ?? ''); // Asegurar que nunca se pase undefined
    }
  };

  return (
    <div className={`space-y-4 ${!safeFormData.isEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Campo de título */}
      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm font-medium">
          {UI_TEXTS.FORM.TITLE_LABEL} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={safeFormData.title ?? ''} // Nunca undefined
          onChange={(e) => handleChange('title', e.target.value)}
          disabled={disabled || !safeFormData.isEnabled}
          className={`w-full px-3 py-2 border rounded-md shadow-sm ${
            validationErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } focus:border-blue-500 focus:ring-1 focus:outline-none`}
          placeholder={UI_TEXTS.FORM.TITLE_PLACEHOLDER}
        />
        {validationErrors.title && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.title}</p>
        )}
      </div>

      {/* Campo de mensaje */}
      <div className="space-y-1">
        <label htmlFor="message" className="block text-sm font-medium">
          {UI_TEXTS.FORM.MESSAGE_LABEL} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          value={safeFormData.message ?? ''} // Nunca undefined
          onChange={(e) => handleChange('message', e.target.value)}
          disabled={disabled || !safeFormData.isEnabled}
          rows={4}
          className={`w-full px-3 py-2 border rounded-md shadow-sm ${
            validationErrors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } focus:border-blue-500 focus:ring-1 focus:outline-none`}
          placeholder={UI_TEXTS.FORM.MESSAGE_PLACEHOLDER}
        />
        {validationErrors.message && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.message}</p>
        )}
      </div>

      {/* Campo de texto del botón */}
      <div className="space-y-1">
        <label htmlFor="startButtonText" className="block text-sm font-medium">
          {UI_TEXTS.FORM.BUTTON_TEXT_LABEL} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="startButtonText"
          value={safeFormData.startButtonText ?? ''} // Nunca undefined
          onChange={(e) => handleChange('startButtonText', e.target.value)}
          disabled={disabled || !safeFormData.isEnabled}
          className={`w-full px-3 py-2 border rounded-md shadow-sm ${
            validationErrors.startButtonText ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          } focus:border-blue-500 focus:ring-1 focus:outline-none`}
          placeholder={UI_TEXTS.FORM.BUTTON_TEXT_PLACEHOLDER}
        />
        {validationErrors.startButtonText && (
          <p className="text-red-500 text-xs mt-1">{validationErrors.startButtonText}</p>
        )}
      </div>
    </div>
  );
}; 