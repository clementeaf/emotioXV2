/**
 * Hooks AlovaJS - TEMPORALMENTE DESHABILITADO
 * NO REEMPLAZA useApiQueries.ts - Solo para testing paralelo
 * 
 * NOTA: Deshabilitado temporalmente debido a problemas de configuración de tipos
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import type { 
  CreateModuleResponseDto, 
  ParticipantResponsesDocument, 
  UpdateModuleResponseDto 
} from '../lib/types';

// ✅ HOOK PARALELO PLACEHOLDER - No reemplaza useAvailableFormsQuery
export function useAvailableFormsQueryAlova(_researchId: string, _options?: {
  enabled?: boolean;
  staleTime?: number;
}) {
  throw new Error('AlovaJS temporalmente deshabilitado');
}

// ✅ HOOK PARALELO PLACEHOLDER - No reemplaza useModuleResponsesQuery
export function useModuleResponsesQueryAlova(
  _researchId: string, 
  _participantId: string,
  _options?: { enabled?: boolean }
) {
  throw new Error('AlovaJS temporalmente deshabilitado');
}

// ✅ HOOK PARALELO PLACEHOLDER - No reemplaza useSaveModuleResponseMutation
export function useSaveModuleResponseMutationAlova(_options?: {
  onSuccess?: (data: ParticipantResponsesDocument, variables: CreateModuleResponseDto) => void;
  onError?: (error: Error, variables: CreateModuleResponseDto) => void;
}) {
  throw new Error('AlovaJS temporalmente deshabilitado');
}

// ✅ HOOK PARALELO PLACEHOLDER - No reemplaza useUpdateModuleResponseMutation
export function useUpdateModuleResponseMutationAlova(_options?: {
  onSuccess?: (data: ParticipantResponsesDocument, variables: { responseId: string; data: UpdateModuleResponseDto }) => void;
  onError?: (error: Error, variables: { responseId: string; data: UpdateModuleResponseDto }) => void;
}) {
  throw new Error('AlovaJS temporalmente deshabilitado');
}

// ✅ HOOK PARALELO PLACEHOLDER - No reemplaza useDeleteAllResponsesMutation
export function useDeleteAllResponsesMutationAlova(_options?: {
  onSuccess?: (data: unknown, variables: { researchId: string; participantId: string }) => void;
  onError?: (error: Error, variables: { researchId: string; participantId: string }) => void;
}) {
  throw new Error('AlovaJS temporalmente deshabilitado');
}

// Debug para desarrollo
if (import.meta.env.DEV) {
  console.log('[AlovaJS Hooks] AlovaJS temporalmente deshabilitado para resolver problemas de tipos');
}