import React from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ValidationErrors } from '../types';

interface WelcomeScreenContentProps {
  title: string;
  message: string;
  startButtonText: string;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onStartButtonTextChange: (value: string) => void;
  validationErrors: ValidationErrors;
  disabled?: boolean;
}

export const WelcomeScreenContent: React.FC<WelcomeScreenContentProps> = ({
  title,
  message,
  startButtonText,
  onTitleChange,
  onMessageChange,
  onStartButtonTextChange,
  validationErrors,
  disabled = false
}) => {
  return (
    <div className="space-y-6 p-4 bg-white rounded-lg border border-neutral-200 shadow-xl">
      {/* Campo de título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Ingresa el título de la pantalla de bienvenida"
          disabled={disabled}
          className={validationErrors.title ? 'border-red-500' : ''}
        />
        {validationErrors.title && (
          <p className="text-sm text-red-500">{validationErrors.title}</p>
        )}
      </div>

      {/* Campo de mensaje */}
      <div className="space-y-2">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className={validationErrors.message ? 'border-red-500' : ''}
          rows={4}
          disabled={disabled}
        />
        {validationErrors.message && (
          <p className="text-sm text-red-500">{validationErrors.message}</p>
        )}
      </div>

      {/* Campo de texto del botón */}
      <div className="space-y-2">
        <Label htmlFor="startButtonText">Texto del botón</Label>
        <Input
          id="startButtonText"
          value={startButtonText}
          onChange={(e) => onStartButtonTextChange(e.target.value)}
          placeholder="Ingresa el texto del botón de inicio"
          disabled={disabled}
          className={validationErrors.startButtonText ? 'border-red-500' : ''}
        />
        {validationErrors.startButtonText && (
          <p className="text-sm text-red-500">{validationErrors.startButtonText}</p>
        )}
      </div>
    </div>
  );
}; 