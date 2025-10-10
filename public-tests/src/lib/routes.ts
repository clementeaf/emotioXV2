import { apiRequest } from './alova';
import { AvailableFormsResponse, CreateModuleResponseDto, ParticipantResponsesDocument, UpdateModuleResponseDto } from './types';

export const getAvailableForms = async (researchId: string): Promise<AvailableFormsResponse> => {
  const result = await apiRequest<AvailableFormsResponse>(`/research/${researchId}/forms`, {
    method: 'GET'
  });

  // 🔍 LOG DE LA RESPUESTA RAW - REMOVIDO

  return result;
};

// 🎯 ALINEADO CON BACKEND: saveModuleResponse retorna ParticipantResponsesDocument
export const saveModuleResponse = async (data: CreateModuleResponseDto): Promise<ParticipantResponsesDocument> => {
  return apiRequest<ParticipantResponsesDocument>('/module-responses', {
    method: 'POST',
    data
  });
};

// 🎯 ALINEADO CON BACKEND: updateModuleResponse retorna ParticipantResponsesDocument
export const updateModuleResponse = async (responseId: string, data: UpdateModuleResponseDto): Promise<ParticipantResponsesDocument> => {
  return apiRequest<ParticipantResponsesDocument>(`/module-responses/${responseId}`, {
    method: 'PUT',
    params: {
      researchId: data.researchId,
      participantId: data.participantId
    },
    data
  });
};

export const getModuleResponses = async (researchId: string, participantId: string): Promise<ParticipantResponsesDocument> => {
  return apiRequest<ParticipantResponsesDocument>('/module-responses', {
    method: 'GET',
    params: { researchId, participantId }
  });
};

export const deleteAllResponses = async (researchId: string, participantId: string): Promise<{ message: string; status: number }> => {
  return apiRequest<{ message: string; status: number }>('/module-responses', {
    method: 'DELETE',
    params: { researchId, participantId }
  });
};
