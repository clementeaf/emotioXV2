/**
 * Constantes para el SmartVOC
 */

import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

// Claves para React Query
export const QUERY_KEYS = {
  SMART_VOC: 'smartVoc'
};

// Mensajes de error
export const ERROR_MESSAGES = {
  FETCH_ERROR: 'Error al cargar la configuración',
  SAVE_ERROR: 'Error al guardar la configuración',
  PREVIEW_ERROR: 'Error al generar vista previa',
  VALIDATION_ERRORS: {
    NO_QUESTIONS: 'Debe incluir al menos una pregunta'
  }
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  CREATE_SUCCESS: 'SmartVOC creado exitosamente',
  UPDATE_SUCCESS: 'SmartVOC guardado correctamente.',
  SAVE_SUCCESS: 'SmartVOC guardado correctamente.'
};

// Textos de la interfaz
export const UI_TEXTS = {
  TITLE: 'Configuración de SmartVOC',
  DESCRIPTION: 'Configure las preguntas y opciones para la recolección de feedback de los usuarios.',
  SETTINGS: {
    ENABLED_LABEL: 'SmartVOC habilitado',
    DISABLED_LABEL: 'SmartVOC deshabilitado',
    RANDOMIZE_TITLE: 'Aleatorizar preguntas',
    RANDOMIZE_DESCRIPTION: 'Las preguntas se mostrarán en orden aleatorio a los usuarios',
    REQUIRED_TITLE: 'Requerir respuestas',
    REQUIRED_DESCRIPTION: 'Los usuarios deben responder todas las preguntas para continuar'
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
    SAVE: 'Guardar configuración',
    UPDATE: 'Actualizar configuración',
    PREVIEW: 'Vista previa',
    CANCEL: 'Cancelar',
    CONFIRM: 'Confirmar'
  },
  MODAL: {
    ERROR_TITLE: 'Error',
    INFO_TITLE: 'Información',
    SUCCESS_TITLE: 'Éxito',
    CLOSE_BUTTON: 'Cerrar',
    SAVE_CONFIRM_TITLE: 'Confirmar configuración',
    SAVE_CONFIRM_MESSAGE: '¿Estás seguro de que deseas guardar esta configuración de SmartVOC?',
    CONFIG_STATUS: 'Estado de la configuración',
    SETTINGS_SECTION: 'Configuración general',
    QUESTIONS_SECTION: 'Preguntas',
    RANDOMIZE_ENABLED: 'Aleatorización de preguntas habilitada',
    RANDOMIZE_DISABLED: 'Aleatorización de preguntas deshabilitada',
    REQUIRED_ENABLED: 'Respuestas obligatorias habilitadas',
    REQUIRED_DISABLED: 'Respuestas obligatorias deshabilitadas',
    QUESTION_COUNT: 'preguntas configuradas',
    NO_QUESTIONS: 'No hay preguntas configuradas'
  },
  ADD_QUESTION_MODAL: {
    TITLE: 'Añadir nueva pregunta',
    DESCRIPTION: 'Seleccione el tipo de pregunta que desea añadir',
    CLOSE_BUTTON: 'Cancelar',
    ADD_BUTTON: 'Añadir'
  }
};

// Las preguntas ahora se crean dinámicamente sin valores por defecto 