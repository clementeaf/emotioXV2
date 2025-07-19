import React from 'react';

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

import { UI_TEXTS } from '../constants';
import { ThankYouScreenContentProps } from '../types';

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
    <div className="space-y-4 p-4 bg-white rounded-lg border border-neutral-200">
      {/* Campo de título */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.CONTENT.TITLE_LABEL}
        </label>
        <Input
          id="thank-you-title"
          name="thank-you-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={disabled}
          error={!!validationErrors.title}
          helperText={validationErrors.title}
          autoComplete="off"
          required={true}
        />
      </div>

      {/* Campo de mensaje */}
      <div className="space-y-2">
        <Textarea
          id="thank-you-message"
          name="thank-you-message"
          label={UI_TEXTS.CONTENT.MESSAGE_LABEL}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={4}
          disabled={disabled}
          error={!!validationErrors.message}
          helperText={validationErrors.message}
          autoComplete="off"
          required={true}
        />
      </div>

      {/* Campo de URL de redirección */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {UI_TEXTS.CONTENT.REDIRECT_URL_LABEL}
        </label>
        <Input
          id="thank-you-redirect-url"
          name="thank-you-redirect-url"
          value={redirectUrl}
          onChange={(e) => onRedirectUrlChange(e.target.value)}
          placeholder={UI_TEXTS.CONTENT.REDIRECT_URL_PLACEHOLDER}
          disabled={disabled}
          error={!!validationErrors.redirectUrl}
          helperText={validationErrors.redirectUrl}
          autoComplete="off"
        />
        <p className="text-xs text-neutral-500">
          {UI_TEXTS.CONTENT.REDIRECT_URL_HELP}
        </p>
      </div>
    </div>
  );
};
