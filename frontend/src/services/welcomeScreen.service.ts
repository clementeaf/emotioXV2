import { config } from '../config/env';

interface WelcomeScreenData {
  id?: string;
  researchId: string;
  isEnabled: boolean;
  title: string;
  message: string;
  startButtonText: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

class WelcomeScreenService {
  private baseUrl = `${config.apiUrl}/welcome-screens`;

  // Obtener welcomeScreen por researchId
  async getByResearchId(researchId: string): Promise<WelcomeScreenData | null> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${this.baseUrl}/research/${researchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Error al obtener welcomeScreen: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error en getByResearchId:', error);
      throw error;
    }
  }

  // Crear nuevo welcomeScreen
  async create(data: WelcomeScreenData): Promise<WelcomeScreenData> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear welcomeScreen');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en create:', error);
      throw error;
    }
  }

  // Actualizar welcomeScreen existente
  async update(researchId: string, data: Partial<WelcomeScreenData>): Promise<WelcomeScreenData> {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No hay token de autenticación');

      const response = await fetch(`${this.baseUrl}/${data.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar welcomeScreen');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error en update:', error);
      throw error;
    }
  }
}

export const welcomeScreenService = new WelcomeScreenService(); 