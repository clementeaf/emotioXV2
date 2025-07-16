import { apiRequest } from './alova';
import { AvailableFormsResponse, CreateModuleResponseDto, ModuleResponse, ParticipantResponsesDocument, UpdateModuleResponseDto } from './types';

export const getAvailableForms = async (researchId: string): Promise<AvailableFormsResponse> => {

  try {
    const result = await apiRequest<AvailableFormsResponse>(`/research/${researchId}/forms`);
    return result;
  } catch (error) {
    console.error('[getAvailableForms] ❌ API falló:', {
      researchId,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

export const saveModuleResponse = async (data: CreateModuleResponseDto): Promise<ModuleResponse> => {
  return apiRequest<ModuleResponse>('/module-responses', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateModuleResponse = async (responseId: string, data: UpdateModuleResponseDto): Promise<ModuleResponse> => {
  return apiRequest<ModuleResponse>(`/module-responses/${responseId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const getModuleResponses = async (researchId: string, participantId: string): Promise<ParticipantResponsesDocument> => {
  const params = new URLSearchParams({ researchId, participantId });
  return apiRequest<ParticipantResponsesDocument>(`/module-responses?${params}`);
};

export const deleteAllResponses = async (researchId: string, participantId: string): Promise<{ message: string; status: number }> => {
  const params = new URLSearchParams({ researchId, participantId });
  return apiRequest<{ message: string; status: number }>(`/module-responses?${params}`, {
    method: 'DELETE'
  });
};
