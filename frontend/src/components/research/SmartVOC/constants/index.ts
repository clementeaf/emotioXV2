/**
 * Constantes para el SmartVOC
 */

// Claves para React Query
export const QUERY_KEYS = {
  SMART_VOC: 'smartVOC'
};

// Mensajes de error
export const ERROR_MESSAGES = {
  FETCH_ERROR: 'Error al cargar los datos de SmartVOC',
  SAVE_ERROR: 'Error al guardar los datos de SmartVOC',
  PREVIEW_ERROR: 'Error al generar la vista previa',
  VALIDATION_ERRORS: {
    NO_QUESTIONS: 'Debes seleccionar al menos una pregunta',
    RESEARCH_ID_REQUIRED: 'El ID de investigación es requerido'
  }
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Configuración de SmartVOC guardada correctamente',
  PREVIEW_COMING_SOON: 'La vista previa estará disponible próximamente'
};

// Textos de la interfaz
export const UI_TEXTS = {
  TITLE: 'Smart VOC',
  DESCRIPTION: 'Configure las preguntas de Voice of Customer para recopilar feedback valioso de los participantes',
  SETTINGS: {
    RANDOMIZE_TITLE: 'Aleatorizar preguntas',
    RANDOMIZE_DESCRIPTION: 'Mostrar las preguntas en orden aleatorio a los participantes',
    REQUIRED_TITLE: 'Requerir respuestas',
    REQUIRED_DESCRIPTION: 'Hacer que las respuestas sean obligatorias para los participantes'
  },
  QUESTIONS: {
    ADD_BUTTON: 'Añadir otra pregunta',
    REMOVE_BUTTON: 'Eliminar',
    QUESTION_TEXT_LABEL: 'Texto de la pregunta',
    INSTRUCTIONS_LABEL: 'Instrucciones (opcional)',
    INSTRUCTIONS_PLACEHOLDER: 'Añada instrucciones o información adicional para los participantes',
    COMPANY_NAME_LABEL: 'Nombre de la empresa o servicio',
    COMPANY_NAME_PLACEHOLDER: 'Introduzca el nombre de la empresa',
    START_LABEL_TEXT: 'Etiqueta inicial (opcional)',
    START_LABEL_PLACEHOLDER: 'Ej: No en absoluto',
    END_LABEL_TEXT: 'Etiqueta final (opcional)',
    END_LABEL_PLACEHOLDER: 'Ej: Totalmente'
  },
  FOOTER: {
    SAVE_TIME: 'Tiempo estimado de finalización: 3-5 minutos',
    NEW_CONFIGURATION: 'Se creará una nueva configuración',
    EXISTING_CONFIGURATION: 'Se actualizará la configuración existente'
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
  },
  ADD_QUESTION_MODAL: {
    TITLE: 'Añadir nueva pregunta',
    DESCRIPTION: 'Seleccione el tipo de pregunta que desea añadir',
    CLOSE_BUTTON: 'Cancelar',
    ADD_BUTTON: 'Añadir'
  }
}; 