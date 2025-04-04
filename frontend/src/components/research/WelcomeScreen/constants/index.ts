/**
 * Constantes para el módulo de pantalla de bienvenida
 */

// Query keys para React Query
export const QUERY_KEYS = {
  WELCOME_SCREEN: 'welcomeScreen'
};

// Endpoints de API
export const API_ENDPOINTS = {
  WELCOME_SCREEN: '/welcome-screens',
  WELCOME_SCREEN_BY_ID: (id: string) => `/welcome-screens/${id}`
};

// Mensajes de error
export const ERROR_MESSAGES = {
  FETCH_ERROR: 'Error al cargar datos de la pantalla de bienvenida',
  SAVE_ERROR: 'Error al guardar la pantalla de bienvenida',
  VALIDATION_ERRORS: {
    TITLE_REQUIRED: 'El título es obligatorio',
    MESSAGE_REQUIRED: 'El mensaje es obligatorio',
    BUTTON_TEXT_REQUIRED: 'El texto del botón es obligatorio'
  }
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Pantalla de bienvenida guardada correctamente',
  PREVIEW_COMING_SOON: 'Funcionalidad de vista previa estará disponible próximamente'
};

// Textos de la interfaz
export const UI_TEXTS = {
  TITLE: 'Pantalla de bienvenida',
  DESCRIPTION: 'Configure la pantalla de bienvenida que verán los participantes al comenzar la investigación',
  TOGGLE: {
    ENABLED: 'La pantalla de bienvenida está habilitada y se mostrará al iniciar la investigación',
    DISABLED: 'La pantalla de bienvenida está deshabilitada y no se mostrará'
  },
  FORM: {
    TITLE_LABEL: 'Título',
    TITLE_PLACEHOLDER: 'Ingrese un título para la pantalla de bienvenida',
    MESSAGE_LABEL: 'Mensaje',
    MESSAGE_PLACEHOLDER: 'Ingrese un mensaje para la pantalla de bienvenida',
    BUTTON_TEXT_LABEL: 'Texto del botón de inicio',
    BUTTON_TEXT_PLACEHOLDER: 'Ingrese el texto para el botón de inicio'
  },
  BUTTONS: {
    PREVIEW: 'Vista previa',
    SAVE: 'Guardar configuración',
    UPDATE: 'Actualizar configuración',
    SAVING: 'Guardando...'
  },
  MODAL: {
    ERROR_TITLE: 'Error',
    INFO_TITLE: 'Información',
    SUCCESS_TITLE: 'Éxito',
    CLOSE_BUTTON: 'Cerrar'
  }
}; 