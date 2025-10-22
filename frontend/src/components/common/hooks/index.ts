/**
 * Hooks genéricos y reutilizables
 * Consolidados desde research hooks para evitar duplicación
 */

export { useFormManager, type UseFormManagerResult, type ErrorModalData, type ValidationErrors } from './useFormManager';
export { useModalManager, type UseModalManagerResult } from './useModalManager';
// TODO: Refactorizar useFileUpload - tiene dependencias específicas de CognitiveTask
