/**
 * 🧪 HOOKS SIMPLIFICADOS PARA TEST DE PARTICIPANTE
 *
 * Este archivo exporta solo los hooks esenciales para el test.
 */

// 🎯 HOOKS ESENCIALES
export { useStepStoreWithBackend } from './useStepStoreWithBackend';
export { useParticipantInfo } from './useParticipantInfo';

// 🎯 HOOKS DE API
export * from './useApiQueries';

// 🎯 HOOKS DE PREGUNTAS
export { useQuestionInitialization } from './useQuestionInitialization';
export { useQuestionHandlers } from './useQuestionHandlers';

// 🎯 HOOKS DE NAVEGACIÓN
export { useButtonSteps } from './useButtonSteps';

// 🎯 TIPOS Y UTILIDADES
export * from './types';
export * from './utils';
