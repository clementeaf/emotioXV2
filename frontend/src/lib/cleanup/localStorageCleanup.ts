import { researchApi } from '@/api/domains/research';

/**
 * Limpia todas las entradas de localStorage relacionadas con una investigación
 * 
 * @param researchId ID de la investigación a limpiar
 */
export function cleanResearchFromLocalStorage(researchId: string): void {
  try {
    // Limpia entradas específicas de research
    localStorage.removeItem(`research_${researchId}`);
    localStorage.removeItem(`research_data_${researchId}`);
    localStorage.removeItem(`research_status_${researchId}`);
    localStorage.removeItem(`research_modules_${researchId}`);
    
    // Limpia entradas de welcome screen
    localStorage.removeItem(`welcome_screen_${researchId}`);
    localStorage.removeItem(`welcome_screen_resource_${researchId}`);
    localStorage.removeItem(`welcome_screen_nonexistent_${researchId}`);
    
    // Limpia entradas de otros módulos
    localStorage.removeItem(`smart_voc_${researchId}`);
    localStorage.removeItem(`eye_tracking_${researchId}`);
    localStorage.removeItem(`cognitive_task_${researchId}`);
    localStorage.removeItem(`thank_you_screen_${researchId}`);
    
    // Limpia entradas de participantes
    localStorage.removeItem(`participants_${researchId}`);
    localStorage.removeItem(`module_responses_${researchId}`);
    
    console.log(`[LocalStorage] Cleaned entries for research: ${researchId}`);
  } catch (error) {
    console.warn(`[LocalStorage] Error cleaning entries for research ${researchId}:`, error);
  }
}

/**
 * Limpia todas las entradas relacionadas con research del localStorage
 */
export function cleanAllResearchFromLocalStorage(): void {
  try {
    const keys = Object.keys(localStorage);
    const researchKeys = keys.filter(key => 
      key.includes('research_') || 
      key.includes('welcome_screen_') ||
      key.includes('smart_voc_') ||
      key.includes('eye_tracking_') ||
      key.includes('cognitive_task_') ||
      key.includes('thank_you_screen_') ||
      key.includes('participants_') ||
      key.includes('module_responses_')
    );
    
    researchKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`[LocalStorage] Cleaned ${researchKeys.length} research-related entries`);
  } catch (error) {
    console.warn('[LocalStorage] Error cleaning all research entries:', error);
  }
}

/**
 * Valida si una investigación existe antes de limpiar
 * 
 * @param researchId ID de la investigación a validar
 * @returns Promise<boolean> true si existe, false si no
 */
export async function validateResearchBeforeCleanup(researchId: string): Promise<boolean> {
  try {
    await researchApi.get(researchId);
    return true;
  } catch (error) {
    // Si falla la petición, la investigación no existe
    cleanResearchFromLocalStorage(researchId);
    return false;
  }
}