/**
 * APIs de EmotioXV2 usando AlovaJS
 * Migración completa de fetch a AlovaJS con useQuery
 */

import { Research, ResearchBasicData } from '../../../shared/interfaces/research.model';
import { Company, GetCompaniesResponse, CompanyResponse, CreateCompanyRequest, UpdateCompanyRequest } from '../../../shared/interfaces/company.interface';
import { alovaApiClient } from '../config/api-alova';
import { alovaInstance } from '../config/alova.config';
import { useRequest, useWatcher } from 'alova/client';

// Tipos
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
  expiresAt: number;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Función para configurar token de autenticación
export const setupAuthToken = () => {
  import('@/services/tokenService').then(({ default: tokenService }) => {
    const token = tokenService.getToken();
    if (token) {
      alovaApiClient.setAuthToken(token);
    }
  }).catch(error => {
    console.error('Error setting up auth token:', error);
  });
};

// ============================================
// HOOKS DE ALOVA PARA CONSUMO EN COMPONENTES
// ============================================

// Hook para empresas con Alova
export const useCompanies = () => {
  return useRequest(
    alovaInstance.Get<GetCompaniesResponse>('/companies'),
    {
      initialData: { success: false, data: [] },
    }
  );
};

export const useCompanyById = (id: string) => {
  return useRequest(
    alovaInstance.Get<CompanyResponse>(`/companies/${id}`),
    {
      initialData: undefined,
    }
  );
};

// Hook para investigaciones con Alova
export const useResearchList = () => {
  return useRequest(
    alovaInstance.Get<APIResponse<Research[]>>('/research'),
    {
      initialData: { success: false, data: [] },
    }
  );
};

export const useResearchById = (id: string) => {
  return useRequest(
    alovaInstance.Get<APIResponse<Research>>(`/research/${id || 'null'}`),
    {
      initialData: undefined,
    }
  );
};

// Hook para welcome screen con Alova
export const useWelcomeScreen = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/welcome-screen`),
    {
      initialData: undefined,
    }
  );
};

// Hook para thank you screen con Alova
export const useThankYouScreen = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/thank-you-screen`),
    {
      initialData: undefined,
    }
  );
};

// Hook para eye tracking con Alova
export const useEyeTracking = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/eye-tracking`),
    {
      initialData: undefined,
    }
  );
};

// Hook para SmartVOC con Alova
export const useSmartVOC = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/smart-voc`),
    {
      initialData: undefined,
    }
  );
};

// Hook para cognitive task con Alova
export const useCognitiveTask = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/research/${researchId || 'null'}/cognitive-task`),
    {
      initialData: undefined,
    }
  );
};

// Hook para module responses con Alova
export const useModuleResponses = (researchId: string) => {
  return useRequest(
    alovaInstance.Get(`/module-responses/research/${researchId || 'null'}`),
    {
      initialData: [],
    }
  );
};

// Hook para participantes con Alova
export const useParticipants = () => {
  return useRequest(
    alovaInstance.Get('/participants'),
    {
      initialData: [],
    }
  );
};

// Hook reactivo que observa cambios (útil para actualizaciones en tiempo real)
export const useWatchResearch = (researchId: string) => {
  return useWatcher(
    () => alovaInstance.Get<APIResponse<Research>>(`/research/${researchId || 'null'}`),
    [researchId],
    {
      initialData: undefined,
      immediate: true,
    }
  );
};

// ============================================
// APIs CON MÉTODOS ESTÁTICOS (para acciones)
// ============================================

// API de empresas
export const companiesAPI = {
  getAll: async (): Promise<GetCompaniesResponse> => {
    return alovaApiClient.get('companies', 'getAll');
  },

  getById: async (id: string): Promise<CompanyResponse> => {
    return alovaApiClient.get('companies', 'getById', { id });
  },

  create: async (data: CreateCompanyRequest): Promise<CompanyResponse> => {
    return alovaApiClient.post('companies', 'create', data);
  },

  update: async (id: string, data: UpdateCompanyRequest): Promise<CompanyResponse> => {
    return alovaApiClient.put('companies', 'update', data, { id });
  },

  delete: async (id: string): Promise<APIResponse<{ message: string }>> => {
    return alovaApiClient.delete('companies', 'delete', { id });
  },
};

// API de autenticación
export const authAPI = {
  login: async (data: LoginRequest): Promise<APIResponse<AuthResponse>> => {
    return alovaApiClient.post('auth', 'login', data);
  },

  logout: async (): Promise<APIResponse> => {
    return alovaApiClient.post('auth', 'logout', {});
  },

  refreshToken: async (): Promise<APIResponse<{ token: string, renewed: boolean, expiresAt: number, user: User }>> => {
    const { default: tokenService } = await import('@/services/tokenService');
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No hay token para refrescar');
    }

    const cleanToken = token.replace('Bearer ', '');
    return alovaApiClient.post('auth', 'refreshToken', { token: cleanToken });
  },

  getProfile: async (): Promise<APIResponse<User>> => {
    return alovaApiClient.get('auth', 'profile');
  },
};

// API de investigaciones
export const researchAPI = {
  create: async (data: ResearchBasicData): Promise<APIResponse<Research>> => {
    return alovaApiClient.post('research', 'create', data);
  },

  get: async (id: string): Promise<APIResponse<Research>> => {
    return alovaApiClient.get('research', 'getById', { id });
  },

  list: async (): Promise<APIResponse<Research[]>> => {
    return alovaApiClient.get('research', 'getAll');
  },

  update: async (id: string, data: Partial<ResearchBasicData>): Promise<APIResponse<Research>> => {
    return alovaApiClient.put('research', 'update', data, { id });
  },

  delete: async (id: string): Promise<APIResponse<boolean>> => {
    if (!id) {
      throw new Error('Se requiere un ID para eliminar la investigación');
    }
    return alovaApiClient.delete('research', 'delete', { id });
  },

  updateStatus: async (id: string, status: string): Promise<APIResponse<Research>> => {
    return alovaApiClient.put('research', 'updateStatus', { status }, { id });
  },

  updateStage: async (id: string, stage: string, progress: number): Promise<APIResponse<Research>> => {
    return alovaApiClient.put('research', 'updateStage', { stage, progress }, { id });
  },
};

// API de pantallas de bienvenida
export const welcomeScreenAPI = {
  getByResearch: (researchId: string) =>
    alovaApiClient.get('welcome-screen', 'getByResearch', { researchId }),
  save: (researchId: string, data: Record<string, unknown>) =>
    alovaApiClient.post('welcome-screen', 'save', data, { researchId }),
  delete: (researchId: string) =>
    alovaApiClient.delete('welcome-screen', 'delete', { researchId }),
};

// API de pantallas de agradecimiento
export const thankYouScreenAPI = {
  getByResearch: (researchId: string) =>
    alovaApiClient.get('thankYouScreen', 'getByResearch', { researchId }),
  save: (researchId: string, data: Record<string, unknown>) =>
    alovaApiClient.post('thankYouScreen', 'save', data, { researchId }),
  delete: (researchId: string) =>
    alovaApiClient.delete('thankYouScreen', 'delete', { researchId }),
};

// API de eye tracking
export const eyeTrackingAPI = {
  create: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking');
    }
    return alovaApiClient.post('eyeTracking', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return alovaApiClient.get('eyeTracking', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking');
    }
    return alovaApiClient.put('eyeTracking', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking');
    }
    return alovaApiClient.delete('eyeTracking', 'delete', { researchId });
  },
};

// API de eye tracking recruit
export const eyeTrackingRecruitAPI = {
  createConfig: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking recruit');
    }
    return alovaApiClient.post('eyeTrackingRecruit', 'createConfig', data, { researchId });
  },

  getConfigByResearch: async (researchId: string): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return alovaApiClient.get('eyeTrackingRecruit', 'getConfigByResearch', { researchId });
  },

  updateConfig: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking recruit');
    }
    return alovaApiClient.put('eyeTrackingRecruit', 'updateConfig', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking recruit');
    }
    return alovaApiClient.delete('eyeTrackingRecruit', 'delete', { researchId });
  },
};

// API de SmartVOC
export const smartVocAPI = {
  create: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear SmartVOC');
    }
    return alovaApiClient.post('smartVoc', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return alovaApiClient.get('smartVoc', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar SmartVOC');
    }
    return alovaApiClient.put('smartVoc', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar SmartVOC');
    }
    return alovaApiClient.delete('smartVoc', 'delete', { researchId });
  },
};

// API de tareas cognitivas
export const cognitiveTaskAPI = {
  create: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la tarea cognitiva');
    }
    return alovaApiClient.post('cognitiveTask', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return alovaApiClient.get('cognitiveTask', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la tarea cognitiva');
    }
    return alovaApiClient.put('cognitiveTask', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la tarea cognitiva');
    }
    return alovaApiClient.delete('cognitiveTask', 'delete', { researchId });
  },
};

// API de S3
export const s3API = {
  upload: async (file: File): Promise<APIResponse<{ url: string; key: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return alovaApiClient.post('s3', 'upload', formData);
  },

  download: async (key: string): Promise<APIResponse<{ url: string }>> => {
    return alovaApiClient.get('s3', 'download', undefined, { key });
  },

  deleteObject: async (key: string): Promise<APIResponse<boolean>> => {
    return alovaApiClient.delete('s3', 'deleteObject', { key });
  },
};

// API de Module Responses
export const moduleResponsesAPI = {
  getResponsesByResearch: async (researchId: string): Promise<APIResponse<unknown[]>> => {
    return alovaApiClient.get('moduleResponses', 'getResponsesByResearch', { researchId });
  },

  getResponsesForParticipant: async (researchId: string, participantId: string): Promise<APIResponse<unknown>> => {
    return alovaApiClient.get('moduleResponses', 'getResponsesForParticipant', { researchId, participantId });
  },

  saveResponse: async (data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    return alovaApiClient.post('moduleResponses', 'saveResponse', data);
  },

  updateResponse: async (responseId: string, data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    return alovaApiClient.put('moduleResponses', 'updateResponse', data, { responseId });
  },

  deleteAllResponses: async (researchId: string, participantId: string): Promise<APIResponse<boolean>> => {
    return alovaApiClient.delete('moduleResponses', 'deleteAllResponses', { researchId, participantId });
  },
};

// API de Participants
export const participantsAPI = {
  getAll: async (): Promise<APIResponse<unknown[]>> => {
    return alovaApiClient.get('participants', 'getAll');
  },

  getById: async (id: string): Promise<APIResponse<unknown>> => {
    return alovaApiClient.get('participants', 'getById', { id });
  },

  login: async (data: { name: string; email: string; researchId: string }): Promise<APIResponse<unknown>> => {
    return alovaApiClient.post('participants', 'login', data);
  },

  create: async (data: Record<string, unknown>): Promise<APIResponse<unknown>> => {
    return alovaApiClient.post('participants', 'create', data);
  },

  delete: async (id: string): Promise<APIResponse<boolean>> => {
    return alovaApiClient.delete('participants', 'delete', { id });
  },
};

// API de Research In Progress
export const researchInProgressAPI = {
  getParticipantsWithStatus: async (researchId: string): Promise<APIResponse<unknown[]>> => {
    return alovaApiClient.get('researchInProgress', 'getParticipantsWithStatus', { researchId });
  },

  getOverviewMetrics: async (researchId: string): Promise<APIResponse<unknown>> => {
    return alovaApiClient.get('researchInProgress', 'getOverviewMetrics', { researchId });
  },

  getParticipantsByResearch: async (researchId: string): Promise<APIResponse<unknown[]>> => {
    return alovaApiClient.get('researchInProgress', 'getParticipantsByResearch', { researchId });
  },

  getParticipantDetails: async (researchId: string, participantId: string): Promise<APIResponse<unknown>> => {
    return alovaApiClient.get('researchInProgress', 'getParticipantDetails', { researchId, participantId });
  },

  deleteParticipant: async (researchId: string, participantId: string): Promise<APIResponse<boolean>> => {
    return alovaApiClient.delete('researchInProgress', 'deleteParticipant', { researchId, participantId });
  },
};

// Exportar todo
export { alovaApiClient, alovaInstance };