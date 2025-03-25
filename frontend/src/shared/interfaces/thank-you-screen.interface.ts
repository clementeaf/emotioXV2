/**
 * Interfaz para la configuración de la pantalla de agradecimiento
 */
export interface ThankYouScreenConfig {
  isEnabled: boolean;
  title: string;
  message: string;
  redirectUrl?: string;
}

/**
 * Modelo de pantalla de agradecimiento para almacenamiento en DynamoDB
 */
export interface ThankYouScreenModel extends ThankYouScreenConfig {
  id: string;
  researchId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Reglas de validación para la pantalla de agradecimiento
 */
export const DEFAULT_THANK_YOU_SCREEN_VALIDATION = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000,
  },
  redirectUrl: {
    required: false,
    pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  },
};

/**
 * Configuración predeterminada de la pantalla de agradecimiento
 */
export const DEFAULT_THANK_YOU_SCREEN_CONFIG: ThankYouScreenConfig = {
  isEnabled: true,
  title: '¡Gracias por participar!',
  message: 'Agradecemos tu tiempo y participación en esta investigación. Tu contribución es muy valiosa para nosotros.',
  redirectUrl: '',
}; 