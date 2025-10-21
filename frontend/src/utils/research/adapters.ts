import { ClientResearch } from '@/shared/interfaces/research.interface';

/**
 * Mapea estados de investigación al formato requerido por ClientResearch
 *
 * @param status - Estado original de la investigación
 * @returns Estado mapeado al formato estándar
 */
export const mapStatus = (status: string): 'pending' | 'in_progress' | 'completed' => {
  switch (status) {
    case 'draft':
      return 'pending';
    case 'in-progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    default:
      return 'pending';
  }
};

/**
 * Adaptador para convertir datos de Research de la API al formato ClientResearch
 *
 * @param data - Array de datos de investigación desde la API
 * @returns Array de datos adaptados al formato ClientResearch
 */
export const adaptResearchData = (data: unknown[]): ClientResearch[] => {
  return data.map((item: any) => ({
    id: item.id,
    name: item.name || item.basic?.name || 'Untitled Research',
    status: mapStatus(item.status),
    progress: item.progress || 0,
    date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown',
    researcher: 'Team Member'
  }));
};
