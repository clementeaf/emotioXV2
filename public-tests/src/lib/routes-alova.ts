/**
 * Funciones API con AlovaJS - TEMPORALMENTE DESHABILITADAS
 * NO REEMPLAZA lib/routes.ts - Solo para testing paralelo
 * 
 * NOTA: Deshabilitado temporalmente debido a problemas de configuración de tipos
 */

import { AvailableFormsResponse, CreateModuleResponseDto, ParticipantResponsesDocument, UpdateModuleResponseDto } from './types';

// ✅ FUNCIÓN PARALELA PLACEHOLDER - No reemplaza getAvailableForms
export const getAvailableFormsAlova = (researchId: string): Promise<AvailableFormsResponse> => {
  throw new Error('AlovaJS temporalmente deshabilitado');
};

// ✅ FUNCIÓN PARALELA PLACEHOLDER - No reemplaza saveModuleResponse  
export const saveModuleResponseAlova = (data: CreateModuleResponseDto): Promise<ParticipantResponsesDocument> => {
  throw new Error('AlovaJS temporalmente deshabilitado');
};

// ✅ FUNCIÓN PARALELA PLACEHOLDER - No reemplaza updateModuleResponse
export const updateModuleResponseAlova = (responseId: string, data: UpdateModuleResponseDto): Promise<ParticipantResponsesDocument> => {
  throw new Error('AlovaJS temporalmente deshabilitado');
};

// ✅ FUNCIÓN PARALELA PLACEHOLDER - No reemplaza getModuleResponses
export const getModuleResponsesAlova = (researchId: string, participantId: string): Promise<ParticipantResponsesDocument> => {
  throw new Error('AlovaJS temporalmente deshabilitado');
};

// ✅ FUNCIÓN PARALELA PLACEHOLDER - No reemplaza deleteAllResponses
export const deleteAllResponsesAlova = (researchId: string, participantId: string): Promise<{ message: string; status: number }> => {
  throw new Error('AlovaJS temporalmente deshabilitado');
};

// Debug para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Routes] AlovaJS temporalmente deshabilitado para resolver problemas de tipos');
}