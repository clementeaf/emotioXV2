/**
 * Utilidades para generar datos simulados durante el desarrollo
 * Estas funciones son útiles cuando la API no está disponible o hay errores
 */

import { v4 as uuidv4 } from 'uuid';

import { ResearchProject } from '@/interfaces/research';

/**
 * Genera un ID único para elementos simulados
 * @param prefix Prefijo para el ID
 * @returns ID único
 */
export function generateMockId(prefix: string = 'mock'): string {
  return `${prefix}-${uuidv4().slice(0, 8)}-${Date.now().toString().slice(-6)}`;
}

/**
 * Devuelve una fecha aleatoria en los últimos días
 * @param maxDaysAgo Máximo de días hacia atrás
 * @returns Fecha ISO string
 */
export function getRandomRecentDate(maxDaysAgo: number = 30): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  now.setDate(now.getDate() - daysAgo);
  return now.toISOString();
}

/**
 * Genera proyectos de investigación simulados
 * @param count Número de proyectos a generar
 * @returns Array de proyectos simulados
 */
export function generateMockResearchProjects(count: number = 5): ResearchProject[] {
  const statuses = ['draft', 'in-progress', 'completed', 'archived'];
  const types = ['eye-tracking', 'attention-prediction', 'cognitive-analysis'];
  const techniques = ['aim-framework', 'biometric', 'interview', 'standard'];
  
  return Array(count).fill(0).map((_, index) => {
    // Determinar estado aleatoriamente
    const statusIndex = Math.floor(Math.random() * statuses.length);
    const status = statuses[statusIndex];
    
    // Progreso basado en estado
    let progress = 0;
    if (status === 'in-progress') {
      progress = Math.floor(Math.random() * 80) + 10; // Entre 10 y 90
    } else if (status === 'completed') {
      progress = 100;
    }
    
    // Seleccionar tipo y técnica aleatoriamente
    const type = types[Math.floor(Math.random() * types.length)];
    const technique = techniques[Math.floor(Math.random() * techniques.length)];
    
    return {
      id: generateMockId('research'),
      name: `Investigación simulada ${index + 1}`,
      status,
      createdAt: getRandomRecentDate(),
      progress,
      type,
      technique
    };
  });
}

/**
 * Genera una respuesta simulada para la API
 * @param data Datos a incluir en la respuesta
 * @returns Objeto con formato de respuesta de API
 */
export function generateMockApiResponse<T>(data: T) {
  return {
    success: true,
    data: data,
    message: 'Datos simulados generados correctamente'
  };
}

/**
 * Simula un retraso en la respuesta para emular el comportamiento de una API real
 * @param minMs Mínimo tiempo de retraso en ms
 * @param maxMs Máximo tiempo de retraso en ms
 * @returns Promise que se resuelve después del retraso
 */
export function simulateNetworkDelay(minMs: number = 200, maxMs: number = 800): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * API simulada de investigaciones para desarrollo local
 */
export const mockResearchAPI = {
  // Lista global de investigaciones simuladas
  _mockStorage: generateMockResearchProjects(8),
  
  /**
   * Obtiene lista de investigaciones
   */
  list: async () => {
    await simulateNetworkDelay();
    return generateMockApiResponse(mockResearchAPI._mockStorage);
  },
  
  /**
   * Obtiene una investigación por ID
   */
  get: async (id: string) => {
    await simulateNetworkDelay();
    const research = mockResearchAPI._mockStorage.find(r => r.id === id);
    
    if (!research) {
      return {
        success: false,
        message: 'Investigación no encontrada',
        data: null
      };
    }
    
    return generateMockApiResponse(research);
  },
  
  /**
   * Crea una nueva investigación
   */
  create: async (data: any) => {
    await simulateNetworkDelay(400, 1000);
    
    const newResearch: ResearchProject = {
      id: generateMockId('research'),
      name: data.name || 'Nueva investigación',
      status: 'draft',
      createdAt: new Date().toISOString(),
      progress: 0,
      type: data.type || 'eye-tracking',
      technique: data.technique || 'standard'
    };
    
    mockResearchAPI._mockStorage.push(newResearch);
    
    return generateMockApiResponse({
      ...newResearch
    });
  },
  
  /**
   * Actualiza una investigación existente
   */
  update: async (id: string, data: any) => {
    await simulateNetworkDelay();
    
    const index = mockResearchAPI._mockStorage.findIndex(r => r.id === id);
    if (index === -1) {
      return {
        success: false,
        message: 'Investigación no encontrada',
        data: null
      };
    }
    
    // Actualizar los campos proporcionados
    mockResearchAPI._mockStorage[index] = {
      ...mockResearchAPI._mockStorage[index],
      ...data,
      // Mantener ID original
      id: mockResearchAPI._mockStorage[index].id
    };
    
    return generateMockApiResponse(mockResearchAPI._mockStorage[index]);
  },
  
  /**
   * Elimina una investigación
   */
  delete: async (id: string) => {
    await simulateNetworkDelay(300, 700);
    
    const index = mockResearchAPI._mockStorage.findIndex(r => r.id === id);
    if (index === -1) {
      return {
        success: false,
        message: 'Investigación no encontrada',
        data: null
      };
    }
    
    mockResearchAPI._mockStorage.splice(index, 1);
    
    return generateMockApiResponse({
      message: 'Investigación eliminada correctamente'
    });
  }
}; 