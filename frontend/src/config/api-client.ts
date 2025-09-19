/**
 * Cliente API Centralizado - ÚNICA FUENTE DE VERDAD
 * Reemplaza toda la carpeta lib con una implementación directa y limpia
 */

import { alovaInstance } from './alova.config';
import { apiClient, API_ENDPOINTS } from './api';

// ============================================
// APIS USANDO ALOVA DIRECTAMENTE
// ============================================

/**
 * API de Autenticación
 */
export const authAPI = {
  login: async (data: { email: string; password: string }) => {
    return apiClient.post('auth', 'login', data);
  },
  
  logout: async () => {
    return apiClient.post('auth', 'logout', {});
  },
  
  refreshToken: async () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token para refrescar');
    return apiClient.post('auth', 'refreshToken', { token: token.replace('Bearer ', '') });
  },
  
  getProfile: async () => {
    return apiClient.get('auth', 'profile');
  }
};

/**
 * API de Investigaciones (Research)
 */
export const researchAPI = {
  create: async (data: any) => {
    return apiClient.post('research', 'create', data);
  },

  get: async (id: string) => {
    return apiClient.get('research', 'getById', { id });
  },

  list: async () => {
    return apiClient.get('research', 'getAll');
  },
  
  update: async (id: string, data: any) => {
    return apiClient.put('research', 'update', data, { id });
  },
  
  delete: async (id: string) => {
    if (!id) throw new Error('Se requiere un ID para eliminar');
    return apiClient.delete('research', 'delete', { id });
  },
  
  updateStatus: async (id: string, status: string) => {
    return apiClient.put('research', 'updateStatus', { status }, { id });
  },
  
  updateStage: async (id: string, stage: string, progress: number) => {
    return apiClient.put('research', 'updateStage', { stage, progress }, { id });
  }
};

/**
 * API de Compañías
 */
export const companiesAPI = {
  getAll: async () => {
    return apiClient.get('companies', 'getAll');
  },
  
  getById: async (id: string) => {
    return apiClient.get('companies', 'getById', { id });
  },
  
  create: async (data: any) => {
    return apiClient.post('companies', 'create', data);
  },
  
  update: async (id: string, data: any) => {
    return apiClient.put('companies', 'update', data, { id });
  },
  
  delete: async (id: string) => {
    if (!id) throw new Error('Se requiere un ID para eliminar');
    console.log('Eliminando empresa con ID:', id);
    return apiClient.delete('companies', 'delete', { id });
  }
};

/**
 * API de Research In Progress
 */
export const researchInProgressAPI = {
  getParticipantsWithStatus: async (researchId: string) => {
    return apiClient.get('researchInProgress', 'getParticipantsWithStatus', { researchId });
  },
  
  getOverviewMetrics: async (researchId: string) => {
    return apiClient.get('researchInProgress', 'getOverviewMetrics', { researchId });
  },
  
  getParticipantsByResearch: async (researchId: string) => {
    return apiClient.get('researchInProgress', 'getParticipantsByResearch', { researchId });
  },
  
  getParticipantDetails: async (researchId: string, participantId: string) => {
    return apiClient.get('researchInProgress', 'getParticipantDetails', { researchId, participantId });
  },
  
  deleteParticipant: async (researchId: string, participantId: string) => {
    return apiClient.delete('researchInProgress', 'deleteParticipant', { researchId, participantId });
  },

  getResearchConfiguration: async (researchId: string) => {
    return apiClient.get('researchInProgress', 'getResearchConfiguration', { researchId });
  }
};

/**
 * API de Thank You Screen
 */
export const thankYouScreenAPI = {
  getByResearch: (researchId: string) =>
    apiClient.get('thankYouScreen', 'getByResearch', { researchId }),

  save: (researchId: string, data: Record<string, unknown>) =>
    apiClient.post('thankYouScreen', 'save', data, { researchId }),

  delete: (researchId: string) =>
    apiClient.delete('thankYouScreen', 'delete', { researchId })
};

/**
 * API de Eye Tracking
 */
export const eyeTrackingAPI = {
  create: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.post('eyeTracking', 'create', data, { researchId });
  },
  
  getByResearch: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.get('eyeTracking', 'getByResearch', { researchId });
  },
  
  update: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.put('eyeTracking', 'update', data, { researchId });
  },
  
  delete: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.delete('eyeTracking', 'delete', { researchId });
  }
};

/**
 * API de Eye Tracking Recruit
 */
export const eyeTrackingRecruitAPI = {
  // Config operations
  createConfig: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.post('eyeTrackingRecruit', 'createConfig', data, { researchId });
  },
  
  getConfigByResearch: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.get('eyeTrackingRecruit', 'getConfigByResearch', { researchId });
  },
  
  updateConfig: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.put('eyeTrackingRecruit', 'updateConfig', data, { researchId });
  },
  
  delete: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.delete('eyeTrackingRecruit', 'delete', { researchId });
  },

  // Participant operations
  createParticipant: async (configId: string, data: any) => {
    if (!configId) throw new Error('Se requiere un ID de configuración');
    return apiClient.post('eyeTrackingRecruit', 'createParticipant', data, { configId });
  },

  updateParticipantStatus: async (participantId: string, status: string) => {
    if (!participantId) throw new Error('Se requiere un ID de participante');
    return apiClient.put('eyeTrackingRecruit', 'updateParticipantStatus', { status }, { participantId });
  },

  getParticipants: async (configId: string) => {
    if (!configId) throw new Error('Se requiere un ID de configuración');
    return apiClient.get('eyeTrackingRecruit', 'getParticipants', { configId });
  },

  getStats: async (configId: string) => {
    if (!configId) throw new Error('Se requiere un ID de configuración');
    return apiClient.get('eyeTrackingRecruit', 'getStats', { configId });
  },

  // Link operations
  generateLink: async (configId: string, type?: string, expirationDays?: number) => {
    if (!configId) throw new Error('Se requiere un ID de configuración');
    return apiClient.post('eyeTrackingRecruit', 'generateLink', { type, expirationDays }, { configId });
  },

  getActiveLinks: async (configId: string) => {
    if (!configId) throw new Error('Se requiere un ID de configuración');
    return apiClient.get('eyeTrackingRecruit', 'getActiveLinks', { configId });
  },

  deactivateLink: async (token: string) => {
    if (!token) throw new Error('Se requiere un token');
    return apiClient.put('eyeTrackingRecruit', 'deactivateLink', {}, { token });
  },

  validateLink: async (token: string) => {
    if (!token) throw new Error('Se requiere un token');
    return apiClient.get('eyeTrackingRecruit', 'validateLink', { token });
  },

  // Summary operations
  getResearchSummary: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.get('eyeTrackingRecruit', 'getResearchSummary', { researchId });
  },

  // Public participant operations
  registerPublicParticipant: async (data: any) => {
    return apiClient.post('eyeTrackingRecruit', 'registerPublicParticipant', data);
  },

  updatePublicParticipantStatus: async (participantId: string, status: string) => {
    if (!participantId) throw new Error('Se requiere un ID de participante');
    return apiClient.put('eyeTrackingRecruit', 'updatePublicParticipantStatus', { status }, { participantId });
  }
};

/**
 * API de SmartVOC
 */
export const smartVocAPI = {
  create: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.post('smartVoc', 'create', data, { researchId });
  },
  
  getByResearch: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.get('smartVoc', 'getByResearch', { researchId });
  },
  
  update: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.put('smartVoc', 'update', data, { researchId });
  },
  
  delete: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.delete('smartVoc', 'delete', { researchId });
  }
};

/**
 * API de Cognitive Task
 */
export const cognitiveTaskAPI = {
  create: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.post('cognitiveTask', 'create', data, { researchId });
  },
  
  getByResearch: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.get('cognitiveTask', 'getByResearch', { researchId });
  },
  
  update: async (researchId: string, data: any) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.put('cognitiveTask', 'update', data, { researchId });
  },
  
  delete: async (researchId: string) => {
    if (!researchId) throw new Error('Se requiere un ID de investigación');
    return apiClient.delete('cognitiveTask', 'delete', { researchId });
  }
};

/**
 * API de Administración
 */
export const adminAPI = {
  getAllUsers: async () => {
    return apiClient.get('admin', 'users');
  },
  
  getUserById: async (id: string) => {
    if (!id) throw new Error('Se requiere un ID de usuario');
    return apiClient.get('admin', 'user', { id });
  },
  
  createUser: async (data: { email: string; password: string; role?: 'user' | 'admin' }) => {
    return apiClient.post('admin', 'users', data);
  },
  
  updateUser: async (id: string, data: { email?: string; password?: string; role?: 'user' | 'admin'; status?: 'active' | 'inactive' }) => {
    if (!id) throw new Error('Se requiere un ID de usuario');
    return apiClient.put('admin', 'user', data, { id });
  },
  
  deleteUser: async (id: string) => {
    if (!id) throw new Error('Se requiere un ID de usuario');
    return apiClient.delete('admin', 'user', { id });
  },
  
  getUserStats: async () => {
    return apiClient.get('admin', 'stats');
  }
};

/**
 * Función para configurar token de autenticación
 */
export const setupAuthToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    apiClient.setAuthToken(token);
    apiClient.setAuthToken?.(token);
  }
};

// ============================================
// EXPORTACIONES CENTRALIZADAS
// ============================================

// Exportar la instancia de Alova para uso directo
export { alovaInstance };

// Exportar clientes
export { apiClient };

// Exportar configuración
export { API_ENDPOINTS };

// Default export
export default alovaInstance;