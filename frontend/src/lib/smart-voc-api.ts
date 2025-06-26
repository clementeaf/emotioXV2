import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

const getToken = () => {
  if (typeof window !== 'undefined') {
    const storageType = localStorage.getItem('auth_storage_type') || 'local';
    return storageType === 'local'
      ? localStorage.getItem('token') || ''
      : sessionStorage.getItem('token') || '';
  }
  return '';
};

const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleSmartVOCResponse = async (response: Response) => {
  try {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `Error ${response.status}: ${response.statusText}`);
    }
    return data;
  } catch (error) {
    const text = await response.text().catch(() => 'No se pudo obtener el cuerpo de la respuesta');
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${text}`);
    }
    return text;
  }
};

export const smartVocFixedAPI = {
  async create(data: SmartVOCFormData): Promise<SmartVOCFormData> {
    const url = API_ENDPOINTS.smartVoc.create.replace('{researchId}', data.researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return handleSmartVOCResponse(response);
  },

  async update(researchId: string, data: Partial<SmartVOCFormData>): Promise<SmartVOCFormData> {
    if (!researchId) throw new Error('ResearchId es necesario para actualizar SmartVOC');
    const url = API_ENDPOINTS.smartVoc.update.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    return handleSmartVOCResponse(response);
  },

  async getByResearchId(researchId: string): Promise<SmartVOCFormData | null> {
    const url = API_ENDPOINTS.smartVoc.getByResearch.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers
    });
    if (response.status === 404) {
      return null;
    }
    return handleSmartVOCResponse(response);
  },

  async deleteSmartVOC(researchId: string, formId: string): Promise<boolean> {
    const url = API_ENDPOINTS.smartVoc.delete.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers
    });
    return response.ok;
  },

  async deleteByResearchId(researchId: string): Promise<boolean> {
    const url = API_ENDPOINTS.smartVoc.delete.replace('{researchId}', researchId);
    const headers = getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers
    });
    return response.ok;
  }
};
