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
  AUTH_ERROR: 'Error de autenticación',
  AUTH_REQUIRED: 'No está autenticado. Por favor, inicie sesión para guardar la pantalla de bienvenida.',
  FORM_ERRORS_TITLE: 'Hay errores en el formulario',
  FORM_ERRORS_MESSAGE: 'Por favor corrija los errores antes de continuar',
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
  TITLE: '',
  DESCRIPTION: '',
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
    SAVE: 'Guardar',
    UPDATE: 'Actualizar',
    SAVING: 'Guardando...',
    SAVED: 'Guardado',
    CANCEL: 'Cancelar',
    CONFIRM_SAVE: 'Confirmar'
  },
  FOOTER: {
    SAVING_TEXT: 'Guardando cambios...',
    UPDATE_EXISTING_TEXT: 'Editando pantalla de bienvenida existente',
    CREATE_NEW_TEXT: 'Creando nueva pantalla de bienvenida',
    SAVING_BUTTON: 'Guardando...',
    PREVIEW_BUTTON: 'Vista previa'
  },
  MODAL: {
    ERROR_TITLE: 'Error',
    INFO_TITLE: 'Información',
    SUCCESS_TITLE: 'Éxito',
    CLOSE_BUTTON: 'Cerrar',
    SAVE_CONFIRM_TITLE: 'Confirmar configuración',
    SAVE_CONFIRM_MESSAGE: '¿Estás seguro de que deseas guardar la siguiente pantalla de bienvenida?',
    SCREEN_STATUS: 'Estado de la pantalla',
    CONTENT: 'Contenido',
    SCREEN_ENABLED: 'Pantalla de bienvenida habilitada',
    SCREEN_DISABLED: 'Pantalla de bienvenida deshabilitada',
    TITLE_SECTION: 'Título',
    MESSAGE_SECTION: 'Mensaje',
    BUTTON_TEXT_SECTION: 'Texto del botón de inicio',
    NO_TITLE: 'Sin título',
    NO_MESSAGE: 'Sin mensaje',
    NO_BUTTON_TEXT: 'Sin texto'
  }
}; 