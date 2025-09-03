/**
 * Funciones API con AlovaJS - PARALELO al sistema actual
 * NO REEMPLAZA lib/routes.ts - Solo para testing paralelo
 */

import { alovaInstance } from './alova-config';
import { AvailableFormsResponse, CreateModuleResponseDto, ParticipantResponsesDocument, UpdateModuleResponseDto } from './types';

// ✅ FUNCIÓN PARALELA - No reemplaza getAvailableForms
export const getAvailableFormsAlova = (researchId: string) => {
  return alovaInstance.Get<AvailableFormsResponse>(`/research/${researchId}/forms`, {
    name: `getAvailableForms-${researchId}`, // Cache key único
    localCache: 300000 // 5 minutos
  });
};

// ✅ FUNCIÓN PARALELA - No reemplaza saveModuleResponse  
export const saveModuleResponseAlova = (data: CreateModuleResponseDto) => {
  return alovaInstance.Post<ParticipantResponsesDocument>('/module-responses', data, {
    name: 'saveModuleResponse',
    localCache: null // No cache para mutaciones
  });
};

// ✅ FUNCIÓN PARALELA - No reemplaza updateModuleResponse
export const updateModuleResponseAlova = (responseId: string, data: UpdateModuleResponseDto) => {
  const params = new URLSearchParams({
    researchId: data.researchId,
    participantId: data.participantId
  });
  
  return alovaInstance.Put<ParticipantResponsesDocument>(`/module-responses/${responseId}?${params}`, data, {
    name: `updateModuleResponse-${responseId}`,
    localCache: null
  });
};

// ✅ FUNCIÓN PARALELA - No reemplaza getModuleResponses
export const getModuleResponsesAlova = (researchId: string, participantId: string) => {
  const params = new URLSearchParams({ researchId, participantId });
  return alovaInstance.Get<ParticipantResponsesDocument>(`/module-responses?${params}`, {
    name: `getModuleResponses-${researchId}-${participantId}`,
    localCache: 300000
  });
};

// ✅ FUNCIÓN PARALELA - No reemplaza deleteAllResponses
export const deleteAllResponsesAlova = (researchId: string, participantId: string) => {
  const params = new URLSearchParams({ researchId, participantId });
  return alovaInstance.Delete<{ message: string; status: number }>(`/module-responses?${params}`, {
    name: `deleteAllResponses-${researchId}-${participantId}`,
    localCache: null
  });
};

// Debug para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Routes] Funciones paralelas creadas:', {
    functions: [
      'getAvailableFormsAlova',
      'saveModuleResponseAlova', 
      'updateModuleResponseAlova',
      'getModuleResponsesAlova',
      'deleteAllResponsesAlova'
    ]
  });
}