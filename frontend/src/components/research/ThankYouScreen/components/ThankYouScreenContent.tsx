import React from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { ThankYouScreenContentProps } from '../types';
import { UI_TEXTS } from '../constants';
import { cn } from '@/lib/utils';

/**
 * Componente para el contenido principal del formulario de la pantalla de agradecimiento
 */
export const ThankYouScreenContent: React.FC<ThankYouScreenContentProps> = ({
  title,
  message,
  redirectUrl,
  onTitleChange,
  onMessageChange,
  onRedirectUrlChange,
  validationErrors,
  disabled
}) => {
  return (
    <div className="space-y-4 p-4 bg-white rounded-lg border border-neutral-100">
      {/* Campo de título */}
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          {UI_TEXTS.CONTENT.TITLE_LABEL} <span className="text-red-500">{UI_TEXTS.REQUIRED_FIELD}</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
            validationErrors.title ? 'border-red-500' : 'border-neutral-200'
          )}
          disabled={disabled}
        />
        {validationErrors.title && (
          <p className="text-xs text-red-500">{validationErrors.title}</p>
        )}
      </div>

      {/* Campo de mensaje */}
      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          {UI_TEXTS.CONTENT.MESSAGE_LABEL} <span className="text-red-500">{UI_TEXTS.REQUIRED_FIELD}</span>
        </label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={4}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
            validationErrors.message ? 'border-red-500' : 'border-neutral-200'
          )}
          disabled={disabled}
        />
        {validationErrors.message && (
          <p className="text-xs text-red-500">{validationErrors.message}</p>
        )}
      </div>

      {/* Campo de URL de redirección */}
      <div className="space-y-2">
        <label htmlFor="redirectUrl" className="text-sm font-medium">
          {UI_TEXTS.CONTENT.REDIRECT_URL_LABEL} <span className="text-neutral-500">{UI_TEXTS.CONTENT.OPTIONAL_LABEL}</span>
        </label>
        <input
          id="redirectUrl"
          value={redirectUrl}
          onChange={(e) => onRedirectUrlChange(e.target.value)}
          placeholder={UI_TEXTS.CONTENT.REDIRECT_URL_PLACEHOLDER}
          className={cn(
            "w-full px-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500",
            validationErrors.redirectUrl ? 'border-red-500' : 'border-neutral-200'
          )}
          disabled={disabled}
        />
        {validationErrors.redirectUrl && (
          <p className="text-xs text-red-500">{validationErrors.redirectUrl}</p>
        )}
        <p className="text-xs text-neutral-500">
          {UI_TEXTS.CONTENT.REDIRECT_URL_HELP}
        </p>
      </div>
    </div>
  );
}; 