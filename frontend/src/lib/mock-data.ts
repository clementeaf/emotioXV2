/**
 * Utilidades para generar datos simulados durante el desarrollo
 * Estas funciones son útiles cuando la API no está disponible o hay errores
 */


import { ResearchProject } from '@/interfaces/research';

/**
 * Genera un ID único para elementos simulados
 * @param prefix Prefijo para el ID
 * @returns ID único
 */
export function generateMockId(prefix: string = 'mock'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Devuelve una fecha aleatoria en los últimos días
 * @param maxDaysAgo Máximo de días hacia atrás
 * @returns Fecha ISO string
 */
export function getRandomRecentDate(maxDaysAgo: number = 30): Date {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  now.setDate(now.getDate() - daysAgo);
  return now;
}

/**
 * Genera proyectos de investigación simulados
 * @param count Número de proyectos a generar
 * @returns Array de proyectos simulados
 */
export function generateMockResearchProjects(): ResearchProject[] {
  // Retornar un array vacío en lugar de generar datos mock
  return [];
}

/**
 * Genera una respuesta simulada para la API
 * @param data Datos a incluir en la respuesta
 * @returns Objeto con formato de respuesta de API
 */
export function generateMockApiResponse<T>(data: T): {
  success: boolean;
  data: T;
  message?: string;
} {
  return {
    success: true,
    data,
    message: 'Operación completada exitosamente'
  };
}

/**
 * Simula un retraso en la respuesta para emular el comportamiento de una API real
 * @param minMs Mínimo tiempo de retraso en ms
 * @param maxMs Máximo tiempo de retraso en ms
 * @returns Promise que se resuelve después del retraso
 */
export function simulateNetworkDelay(minMs: number = 300, maxMs: number = 1500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * API simulada de investigaciones para desarrollo local
 */
export const mockResearchAPI = {
  // Almacenamiento vacío en lugar de datos generados
  _mockStorage: [] as ResearchProject[],

  /**
   * Obtiene lista de investigaciones
   */
  async list(): Promise<{ success: boolean; data: ResearchProject[] }> {
    await simulateNetworkDelay();
    return generateMockApiResponse(mockResearchAPI._mockStorage);
  },

  /**
   * Obtiene una investigación por ID
   */
  async get(id: string): Promise<{ success: boolean; data: ResearchProject | null }> {
    await simulateNetworkDelay();
    const research = mockResearchAPI._mockStorage.find(r => r.id === id);
    return generateMockApiResponse(research || null);
  },

  /**
   * Crea una nueva investigación
   */
  async create(data: Omit<ResearchProject, 'id' | 'createdAt'>): Promise<{
    success: boolean;
    data: ResearchProject;
  }> {
    await simulateNetworkDelay();

    // Crear nueva investigación con ID generado y fecha actual
    const newResearch: ResearchProject = {
      ...data,
      id: generateMockId('research'),
      createdAt: new Date().toISOString(),
    };

    mockResearchAPI._mockStorage.push(newResearch);
    return generateMockApiResponse(newResearch);
  },

  /**
   * Actualiza una investigación existente
   */
  async update(id: string, data: Partial<ResearchProject>): Promise<{
    success: boolean;
    data: ResearchProject | null;
  }> {
    await simulateNetworkDelay();

    const index = mockResearchAPI._mockStorage.findIndex(r => r.id === id);
    if (index === -1) {
      return generateMockApiResponse(null);
    }

    // Actualizar los datos de la investigación
    mockResearchAPI._mockStorage[index] = {
      ...mockResearchAPI._mockStorage[index],
      ...data,
      // Preservar ID original
      id: mockResearchAPI._mockStorage[index].id
    };

    return generateMockApiResponse(mockResearchAPI._mockStorage[index]);
  },

  /**
   * Elimina una investigación
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    await simulateNetworkDelay();

    const index = mockResearchAPI._mockStorage.findIndex(r => r.id === id);
    if (index === -1) {
      return {
        success: false,
        message: 'Investigación no encontrada'
      };
    }

    mockResearchAPI._mockStorage.splice(index, 1);
    return {
      success: true,
      message: 'Investigación eliminada correctamente'
    };
  }
};

// Datos mock para desarrollo y testing
// Estos datos se usan cuando la API no está disponible o en modo desarrollo

export const mockResearchData = [
  {
    id: '1',
    title: 'Estudio de UX - E-commerce',
    status: 'active',
    participants: 150,
    completionRate: 85,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-20T14:45:00Z'
  },
  {
    id: '2',
    title: 'Análisis de Emociones - App Móvil',
    status: 'completed',
    participants: 200,
    completionRate: 92,
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-18T16:20:00Z'
  }
];

export const mockClientsData = [
  {
    id: '1',
    name: 'Universidad del Desarrollo',
    email: 'contacto@udd.cl',
    company: 'Universidad del Desarrollo',
    status: 'active',
    researchCount: 5,
    lastActivity: '2024-01-20T14:45:00Z'
  },
  {
    id: '2',
    name: 'Cliente Demo',
    email: 'demo@cliente.com',
    company: 'Cliente Demo',
    status: 'active',
    researchCount: 2,
    lastActivity: '2024-01-18T16:20:00Z'
  }
];
