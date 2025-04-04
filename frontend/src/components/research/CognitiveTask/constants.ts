export const QUERY_KEYS = {
  COGNITIVE_TASK: 'cognitiveTask'
};

export const UI_TEXTS = {
  TITLE: 'Tareas Cognitivas',
  DESCRIPTION: 'Configure las tareas cognitivas para esta investigación.',
  FORM: {
    RANDOMIZE_TITLE: 'Aleatorizar Preguntas',
    RANDOMIZE_DESCRIPTION: 'Presentar preguntas en orden aleatorio a cada participante',
    QUESTIONS_SECTION_TITLE: 'Preguntas',
    ADD_QUESTION_BUTTON: 'Añadir Pregunta',
    ADD_NEW_QUESTION_BUTTON: 'Añadir Nueva Pregunta',
    QUESTION_MODAL_TITLE: 'Añadir nueva pregunta',
    DEVICE_FRAME_LABEL: 'Marco de Dispositivo',
    NO_FRAME_TEXT: 'Sin Marco',
    SHOW_CONDITIONALLY: 'Mostrar condicionalmente',
    REQUIRED: 'Obligatorio',
    ADD_CHOICE_BUTTON: 'Añadir otra opción',
    DELETE_CHOICE_BUTTON: 'Eliminar',
    QUALIFY_LABEL: 'Calificar',
    DISQUALIFY_LABEL: 'Descalificar',
    START_VALUE_LABEL: 'Valor inicial',
    END_VALUE_LABEL: 'Valor final',
    FILE_UPLOAD: {
      DRAG_TEXT: 'Haga clic o arrastre el archivo a esta área para cargar',
      SUPPORT_TEXT: 'Compatibilidad con carga única o por lotes. Tamaño máximo de archivo 5 MB.',
      SELECT_BUTTON: 'Seleccionar imágenes',
      SELECTED_FILES: 'Archivos seleccionados:',
      REMOVE_FILE: 'Eliminar'
    }
  },
  BUTTONS: {
    SAVE: 'Guardar y Continuar',
    UPDATE: 'Actualizar y Continuar',
    SAVING: 'Guardando...',
    PREVIEW: 'Vista Previa'
  },
  FOOTER: {
    COMPLETION_TIME: 'Tiempo estimado de finalización: 5-7 minutos'
  }
};

export const ERROR_MESSAGES = {
  FETCH_ERROR: 'Error al obtener datos de tareas cognitivas',
  SAVE_ERROR: 'Error al guardar los datos de tareas cognitivas',
  VALIDATION: {
    EMPTY_TITLE: 'El título de la pregunta es obligatorio',
    EMPTY_CHOICES: 'Debe proporcionar al menos una opción',
    EMPTY_FILES: 'Debe subir al menos un archivo para esta pregunta'
  }
};

export const SUCCESS_MESSAGES = {
  CREATED: 'Configuración de tareas cognitivas guardada correctamente',
  UPDATED: 'Configuración de tareas cognitivas actualizada correctamente'
}; 