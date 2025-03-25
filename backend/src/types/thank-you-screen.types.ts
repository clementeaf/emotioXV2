/**
 * Configuración de la pantalla de agradecimiento
 */
export interface ThankYouScreenConfig {
  // Si la pantalla de agradecimiento está habilitada
  isEnabled: boolean;
  
  // Título mostrado en la pantalla de agradecimiento
  title: string;
  
  // Mensaje mostrado en la pantalla de agradecimiento
  message: string;
  
  // URL opcional para redirigir después de mostrar la pantalla de agradecimiento
  redirectUrl?: string;
}

/**
 * Modelo de pantalla de agradecimiento para almacenamiento en DynamoDB
 */
export interface ThankYouScreenModel extends ThankYouScreenConfig {
  // Clave primaria
  id: string;
  
  // ID de la investigación a la que pertenece esta pantalla de agradecimiento
  researchId: string;
  
  // Fechas de creación y actualización
  createdAt: string;
  updatedAt: string;
}

/**
 * Reglas de validación para los campos de la pantalla de agradecimiento
 */
export const ThankYouScreenValidation = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 100
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  redirectUrl: {
    required: false,
    pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/i
  }
}; 