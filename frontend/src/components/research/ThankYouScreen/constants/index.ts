/**
 * Constantes para el componente ThankYouScreen
 */

// Claves de consulta para React Query
export const QUERY_KEYS = {
  THANK_YOU_SCREEN: 'thankYouScreen'
};

// Mensajes de error
export const ERROR_MESSAGES = {
  FETCH_ERROR: 'No se pudo cargar la pantalla de agradecimiento',
  SAVE_ERROR: 'Error al guardar la pantalla de agradecimiento',
  PREVIEW_ERROR: 'Error al generar la vista previa',
  AUTH_ERROR: 'Error de autenticación. Por favor, inicie sesión nuevamente',
  VALIDATION_ERRORS: {
    TITLE_REQUIRED: 'El título es obligatorio',
    TITLE_TOO_SHORT: 'El título debe tener al menos {min} caracteres',
    TITLE_TOO_LONG: 'El título no puede exceder {max} caracteres',
    MESSAGE_REQUIRED: 'El mensaje es obligatorio',
    MESSAGE_TOO_SHORT: 'El mensaje debe tener al menos {min} caracteres',
    MESSAGE_TOO_LONG: 'El mensaje no puede exceder {max} caracteres',
    INVALID_URL: 'La URL de redirección no tiene un formato válido',
    RESEARCH_ID_REQUIRED: 'El ID de investigación es obligatorio',
  }
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Pantalla de agradecimiento guardada exitosamente',
  PREVIEW_COMING_SOON: '¡Vista previa disponible próximamente!',
  UPDATED: 'Pantalla de agradecimiento actualizada correctamente.',
  CREATED: 'Pantalla de agradecimiento creada correctamente.'
};

// Textos para la interfaz de usuario
export const UI_TEXTS = {
  TITLE: '',
  DESCRIPTION: '',
  SETTINGS: {
    ENABLED_LABEL: 'Habilitado',
    DISABLED_LABEL: 'Deshabilitado'
  },
  CONTENT: {
    TITLE_LABEL: 'Título',
    MESSAGE_LABEL: 'Mensaje',
    REDIRECT_URL_LABEL: 'URL de redirección',
    REDIRECT_URL_PLACEHOLDER: 'https://ejemplo.com',
    REDIRECT_URL_HELP: 'Si se proporciona, los participantes serán redirigidos a esta URL después de mostrar la pantalla de agradecimiento',
    OPTIONAL_LABEL: '(opcional)'
  },
  FOOTER: {
    SAVING_TEXT: 'Guardando...',
    UPDATE_EXISTING_TEXT: 'Se actualizará la configuración existente',
    CREATE_NEW_TEXT: 'Se creará una nueva configuración',
    PREVIEW_BUTTON: 'Vista previa',
    SAVE_BUTTON: 'Guardar cambios',
    SAVING_BUTTON: 'Guardando...'
  },
  MODAL: {
    ERROR_TITLE: 'Error',
    INFO_TITLE: 'Información',
    SUCCESS_TITLE: 'Éxito',
    CLOSE_BUTTON: 'Cerrar'
  },
  REQUIRED_FIELD: '*'
}; 