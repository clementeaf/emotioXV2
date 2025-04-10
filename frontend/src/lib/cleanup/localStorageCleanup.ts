import { researchAPI } from '@/lib/api';

/**
 * Limpia todas las entradas de localStorage relacionadas con una investigación
 * 
 * @param researchId ID de la investigación a limpiar
 */
export function cleanResearchFromLocalStorage(researchId: string): void {
  try {
    // Eliminar la entrada principal
    localStorage.removeItem(`research_${researchId}`);
    
    // Eliminar entradas asociadas para componentes específicos
    localStorage.removeItem(`welcome-screen_nonexistent_${researchId}`);
    localStorage.removeItem(`thank-you-screen_nonexistent_${researchId}`);
    localStorage.removeItem(`eye-tracking_nonexistent_${researchId}`);
    localStorage.removeItem(`smart-voc_nonexistent_${researchId}`);
    
    // Actualizar la lista de investigaciones recientes
    try {
      const storedList = localStorage.getItem('research_list');
      if (storedList) {
        const researchList = JSON.parse(storedList);
        const updatedList = researchList.filter((r: any) => r.id !== researchId);
        localStorage.setItem('research_list', JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error('Error actualizando la lista de investigaciones:', e);
    }
    
    console.log(`Limpieza de localStorage completada para investigación: ${researchId}`);
  } catch (error) {
    console.error('Error durante la limpieza de localStorage:', error);
  }
}

/**
 * Verifica si una investigación existe en el backend y limpia localStorage si no existe
 * 
 * @param researchId ID de la investigación a verificar
 * @returns Promise<boolean> true si la investigación existe, false si no
 */
export async function validateAndCleanResearch(researchId: string): Promise<boolean> {
  try {
    // Verificar si la investigación existe en el backend
    await researchAPI.get(researchId);
    
    // Si llegamos aquí, la investigación existe
    return true;
  } catch (error: any) {
    // Si es un error 404, la investigación no existe
    if (error?.response?.status === 404 || 
        (error?.message && error.message.includes('404'))) {
      
      // Limpiar localStorage
      cleanResearchFromLocalStorage(researchId);
      
      return false;
    }
    
    // Para otros tipos de error, asumimos que la investigación existe
    // pero hubo un problema temporal de conexión
    return true;
  }
}

/**
 * Limpia todas las investigaciones obsoletas del localStorage
 * verificando si existen en el backend
 */
export async function cleanAllObsoleteResearch(): Promise<void> {
  try {
    // Obtener la lista de investigaciones
    const storedList = localStorage.getItem('research_list');
    if (!storedList) return;
    
    const researchList = JSON.parse(storedList);
    const updatedList = [];
    
    // Verificar cada investigación
    for (const research of researchList) {
      const exists = await validateAndCleanResearch(research.id);
      if (exists) {
        updatedList.push(research);
      }
    }
    
    // Actualizar la lista
    localStorage.setItem('research_list', JSON.stringify(updatedList));
    
    console.log('Limpieza de investigaciones obsoletas completada');
  } catch (error) {
    console.error('Error durante la limpieza de investigaciones obsoletas:', error);
  }
} 