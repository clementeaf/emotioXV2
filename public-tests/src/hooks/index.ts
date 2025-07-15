/**
 * 🧪 HOOKS SIMPLIFICADOS PARA TEST DE PARTICIPANTE
 *
 * Este archivo exporta solo los hooks necesarios para el test,
 * sin lógica de backend.
 */

// Hooks principales
export { useFlowNavigationAndState } from './useFlowNavigationAndState';
export { useGDPRConsent } from './useGDPRConsent';
export { useParticipantFlow } from './useParticipantFlow';

// Hooks de utilidad
export { useDeleteState } from './useDeleteState';
export { useSubmitState } from './useSubmitState';

// Tipos y utilidades
export * from './types';
export * from './utils';
