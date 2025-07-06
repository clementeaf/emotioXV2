/**
 * Configuración de AWS Amplify para navegación entre aplicaciones
 * 
 * Este archivo permite que el frontend navegue dinámicamente a public-tests
 * usando las URLs generadas por AWS Amplify
 */

import { AMPLIFY_URLS, getPublicTestsUrl, navigateToPublicTests } from '../api/endpoints.js';

export interface AmplifyUrls {
  frontend: string;
  publicTests: string;
  frontendAppId: string;
  publicTestsAppId: string;
  generatedAt: string;
}

/**
 * Obtiene las URLs de las aplicaciones Amplify
 */
export function getAmplifyUrls(): AmplifyUrls | null {
  try {
    return AMPLIFY_URLS as AmplifyUrls;
  } catch (error) {
    console.warn('No se pudieron cargar URLs de Amplify:', error);
    return null;
  }
}

/**
 * Obtiene la URL de public-tests
 * Usa las URLs de Amplify si están disponibles, sino fallback
 */
export function getPublicTestsUrlSafe(): string {
  try {
    return getPublicTestsUrl();
  } catch (error) {
    console.warn('Error obteniendo URL de public-tests, usando fallback:', error);
    return 'http://localhost:4700';
  }
}

/**
 * Navega a public-tests con un researchID específico
 */
export function navigateToPublicTestsSafe(researchID: string): void {
  try {
    navigateToPublicTests(researchID);
  } catch (error) {
    console.error('Error navegando a public-tests:', error);
    // Fallback manual
    const fallbackUrl = `http://localhost:4700/${researchID}`;
    window.open(fallbackUrl, '_blank');
  }
}

/**
 * Obtiene información sobre el estado de la configuración Amplify
 */
export function getAmplifyStatus() {
  const urls = getAmplifyUrls();
  
  return {
    isConfigured: !!urls,
    frontendUrl: urls?.frontend || 'No configurado',
    publicTestsUrl: urls?.publicTests || 'No configurado',
    lastUpdated: urls?.generatedAt || 'Nunca',
    frontendAppId: urls?.frontendAppId || 'No disponible',
    publicTestsAppId: urls?.publicTestsAppId || 'No disponible'
  };
}

/**
 * Verifica si una URL es de una aplicación Amplify
 */
export function isAmplifyUrl(url: string): boolean {
  return /\.amplifyapp\.com/.test(url);
}

/**
 * Extrae el App ID de una URL de Amplify
 */
export function extractAppIdFromUrl(url: string): string | null {
  const match = url.match(/https?:\/\/(?:[\w-]+\.)?(\w+)\.amplifyapp\.com/);
  return match ? match[1] : null;
}

// Exportar también las funciones desde endpoints.js para uso directo
export { getPublicTestsUrl, navigateToPublicTests, AMPLIFY_URLS } from '../api/endpoints.js';
