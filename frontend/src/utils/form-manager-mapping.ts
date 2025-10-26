/**
 * Mapeo de QuestionKeys a API Hooks
 * Centraliza la lógica de selección de hooks basada en questionKey
 */

import { useScreenFormsData } from '@/api/domains/screen-forms';
import { useSmartVOCData } from '@/api/domains/smart-voc';
import { useCognitiveTaskData } from '@/api/domains/cognitive-task';
import { useEyeTrackingData } from '@/api/domains/eye-tracking';

/**
 * Mapeo de QuestionKeys a sus respectivos API Hooks
 * TODO: Los hooks actuales no implementan la interfaz ApiHookResult completa
 * Se necesita refactorizar los hooks para que tengan updateData, createData, deleteData
 */
const API_HOOK_MAP: Record<string, (researchId: string | null) => any> = {
  'welcome_screen': (researchId: string | null) => useScreenFormsData(researchId, 'welcome'),
  'thank_you_screen': (researchId: string | null) => useScreenFormsData(researchId, 'thankyou'),
  'thankyou_screen': (researchId: string | null) => useScreenFormsData(researchId, 'thankyou'),
  'smartvoc': useSmartVOCData,
  'cognitive_task': useCognitiveTaskData,
  'eye_tracking': useEyeTrackingData,
};

/**
 * Obtener el hook de API apropiado basado en questionKey
 * @param questionKey - Identificador único del tipo de formulario
 * @returns Hook de API correspondiente
 */
export const getApiHookByQuestionKey = (questionKey: string) => {
  const apiHook = API_HOOK_MAP[questionKey];
  
  if (!apiHook) {
    throw new Error(`No se encontró hook de API para questionKey: ${questionKey}`);
  }
  
  return apiHook;
};

/**
 * Verificar si un questionKey es válido
 * @param questionKey - Identificador a verificar
 * @returns true si es válido, false si no
 */
export const isValidQuestionKey = (questionKey: string): boolean => {
  return questionKey in API_HOOK_MAP;
};

/**
 * Obtener todos los questionKeys disponibles
 * @returns Array de questionKeys válidos
 */
export const getAvailableQuestionKeys = (): string[] => {
  return Object.keys(API_HOOK_MAP);
};
