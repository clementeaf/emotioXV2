/**
 * Utilidades para nombres de formularios
 * Mapeo de questionKey a nombres legibles
 */

/**
 * Obtener nombre del formulario basado en questionKey
 */
export const getFormNameByQuestionKey = (questionKey: string): string => {
  const nameMap: Record<string, string> = {
    // Pantallas simples
    'welcome_screen': 'Pantalla de Bienvenida',
    'thank_you_screen': 'Pantalla de Agradecimiento',
    
    // SmartVOC - 6 preguntas
    'smartvoc_csat': 'SmartVOC CSAT',
    'smartvoc_ces': 'SmartVOC CES',
    'smartvoc_cv': 'SmartVOC CV',
    'smartvoc_nev': 'SmartVOC NEV',
    'smartvoc_nps': 'SmartVOC NPS',
    'smartvoc_voc': 'SmartVOC VOC',
    
    // CognitiveTask - 8 preguntas
    'cognitive_short_text': 'Tarea Cognitiva - Texto Corto',
    'cognitive_long_text': 'Tarea Cognitiva - Texto Largo',
    'cognitive_single_choice': 'Tarea Cognitiva - Opción Única',
    'cognitive_multiple_choice': 'Tarea Cognitiva - Opción Múltiple',
    'cognitive_linear_scale': 'Tarea Cognitiva - Escala Lineal',
    'cognitive_ranking': 'Tarea Cognitiva - Ranking',
    'cognitive_navigation_flow': 'Tarea Cognitiva - Flujo de Navegación',
    'cognitive_preference_test': 'Tarea Cognitiva - Prueba de Preferencia',
    
    // Eye tracking
    'eye_tracking': 'Eye Tracking',
  };
  
  return nameMap[questionKey] || questionKey;
};

/**
 * Obtener todos los nombres de formularios disponibles
 */
export const getAllFormNames = (): Record<string, string> => {
  return {
    'welcome_screen': 'Pantalla de Bienvenida',
    'thank_you_screen': 'Pantalla de Agradecimiento',
    'smartvoc_csat': 'SmartVOC CSAT',
    'smartvoc_ces': 'SmartVOC CES',
    'smartvoc_cv': 'SmartVOC CV',
    'smartvoc_nev': 'SmartVOC NEV',
    'smartvoc_nps': 'SmartVOC NPS',
    'smartvoc_voc': 'SmartVOC VOC',
    'cognitive_short_text': 'Tarea Cognitiva - Texto Corto',
    'cognitive_long_text': 'Tarea Cognitiva - Texto Largo',
    'cognitive_single_choice': 'Tarea Cognitiva - Opción Única',
    'cognitive_multiple_choice': 'Tarea Cognitiva - Opción Múltiple',
    'cognitive_linear_scale': 'Tarea Cognitiva - Escala Lineal',
    'cognitive_ranking': 'Tarea Cognitiva - Ranking',
    'cognitive_navigation_flow': 'Tarea Cognitiva - Flujo de Navegación',
    'cognitive_preference_test': 'Tarea Cognitiva - Prueba de Preferencia',
    'eye_tracking': 'Eye Tracking',
  };
};
