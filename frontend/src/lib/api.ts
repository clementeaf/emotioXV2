import { apiClient } from '../config/api';

// Tipos
interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: any;
  expiresAt: number;
}

interface APIResponse<T = any> {
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

interface ResearchBasicData {
  title: string;
  description?: string;
  status?: string;
  stage?: string;
  progress?: number;
}

interface Research extends ResearchBasicData {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Función para configurar token de autenticación (se llamará cuando sea necesario)
export const setupAuthToken = () => {
  // Importación dinámica para evitar dependencia circular
  import('@/services/tokenService').then(({ default: tokenService }) => {
    const token = tokenService.getToken();
    if (token) {
      apiClient.setAuthToken(token);
    }
  }).catch(error => {
    console.warn('No se pudo configurar el token de autenticación:', error);
  });
};

// API de autenticación
export const authAPI = {
  login: async (data: LoginRequest): Promise<APIResponse<AuthResponse>> => {
    return apiClient.post('auth', 'login', data);
  },

  logout: async (): Promise<APIResponse> => {
    return apiClient.post('auth', 'logout', {});
  },

  refreshToken: async (): Promise<APIResponse<{token: string, renewed: boolean, expiresAt: number, user: any}>> => {
    // Importación dinámica para evitar dependencia circular
    const { default: tokenService } = await import('@/services/tokenService');
    const token = tokenService.getToken();
    if (!token) {
      throw new Error('No hay token para refrescar');
    }

    const cleanToken = token.replace('Bearer ', '');
    return apiClient.post('auth', 'refreshToken', { token: cleanToken });
  },

  getProfile: async (): Promise<APIResponse<User>> => {
    return apiClient.get('auth', 'profile');
  },
};

// API de investigaciones
export const researchAPI = {
  create: async (data: ResearchBasicData): Promise<APIResponse<Research>> => {
    const processedData = {
      ...data,
      status: data.status || 'draft',
      stage: data.stage || 'setup',
      progress: data.progress || 0,
    };

    return apiClient.post('research', 'create', processedData);
  },

  get: async (id: string): Promise<APIResponse<Research>> => {
    return apiClient.get('research', 'getById', { id });
  },

  list: async (): Promise<APIResponse<Research[]>> => {
    return apiClient.get('research', 'getAll');
  },

  update: async (id: string, data: Partial<ResearchBasicData>): Promise<APIResponse<Research>> => {
    return apiClient.put('research', 'update', data, { id });
  },

  delete: async (id: string): Promise<APIResponse<boolean>> => {
    if (!id) {
      throw new Error('Se requiere un ID para eliminar la investigación');
    }
    return apiClient.delete('research', 'delete', { id });
  },

  updateStatus: async (id: string, status: string): Promise<APIResponse<Research>> => {
    return apiClient.put('research', 'updateStatus', { status }, { id });
  },

  updateStage: async (id: string, stage: string, progress: number): Promise<APIResponse<Research>> => {
    return apiClient.put('research', 'updateStage', { stage, progress }, { id });
  },
};

// API de pantallas de agradecimiento
export const thankYouScreenAPI = {
  create: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la pantalla de agradecimiento');
    }
    return apiClient.post('thankYouScreen', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('thankYouScreen', 'getByResearch', { researchId });
  },

  update: async (researchId: string, screenId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la pantalla de agradecimiento');
    }
    return apiClient.put('thankYouScreen', 'update', data, { researchId, screenId });
  },

  delete: async (researchId: string, screenId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la pantalla de agradecimiento');
    }
    return apiClient.delete('thankYouScreen', 'delete', { researchId, screenId });
  },
};

// API de eye tracking
export const eyeTrackingAPI = {
  create: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking');
    }
    return apiClient.post('eyeTracking', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('eyeTracking', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking');
    }
    return apiClient.put('eyeTracking', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking');
    }
    return apiClient.delete('eyeTracking', 'delete', { researchId });
  },
};

// API de eye tracking recruit
export const eyeTrackingRecruitAPI = {
  createConfig: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear eye tracking recruit');
    }
    return apiClient.post('eyeTrackingRecruit', 'createConfig', data, { researchId });
  },

  getConfigByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('eyeTrackingRecruit', 'getConfigByResearch', { researchId });
  },

  updateConfig: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar eye tracking recruit');
    }
    return apiClient.put('eyeTrackingRecruit', 'updateConfig', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar eye tracking recruit');
    }
    return apiClient.delete('eyeTrackingRecruit', 'createConfig', { researchId });
  },
};

// API de SmartVOC
export const smartVocAPI = {
  create: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear SmartVOC');
    }
    return apiClient.post('smartVoc', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('smartVoc', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar SmartVOC');
    }
    return apiClient.put('smartVoc', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar SmartVOC');
    }
    return apiClient.delete('smartVoc', 'delete', { researchId });
  },
};

// API de pantallas de bienvenida
export const welcomeScreenAPI = {
  create: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la pantalla de bienvenida');
    }
    return apiClient.post('welcomeScreen', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('welcomeScreen', 'getByResearch', { researchId });
  },

  update: async (researchId: string, screenId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la pantalla de bienvenida');
    }
    return apiClient.put('welcomeScreen', 'update', data, { researchId, screenId });
  },

  delete: async (researchId: string, screenId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la pantalla de bienvenida');
    }
    return apiClient.delete('welcomeScreen', 'delete', { researchId, screenId });
  },
};

// API de tareas cognitivas
export const cognitiveTaskAPI = {
  create: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para crear la tarea cognitiva');
    }
    return apiClient.post('cognitiveTask', 'create', data, { researchId });
  },

  getByResearch: async (researchId: string): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación');
    }
    return apiClient.get('cognitiveTask', 'getByResearch', { researchId });
  },

  update: async (researchId: string, data: any): Promise<APIResponse<any>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para actualizar la tarea cognitiva');
    }
    return apiClient.put('cognitiveTask', 'update', data, { researchId });
  },

  delete: async (researchId: string): Promise<APIResponse<boolean>> => {
    if (!researchId) {
      throw new Error('Se requiere un ID de investigación para eliminar la tarea cognitiva');
    }
    return apiClient.delete('cognitiveTask', 'delete', { researchId });
  },
};

// API de S3
export const s3API = {
  upload: async (file: File): Promise<APIResponse<{ url: string; key: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('s3', 'upload', formData);
  },

  download: async (key: string): Promise<APIResponse<{ url: string }>> => {
    return apiClient.get('s3', 'download', undefined, { key });
  },

  deleteObject: async (key: string): Promise<APIResponse<boolean>> => {
    return apiClient.delete('s3', 'deleteObject', { key });
  },
};
