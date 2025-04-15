/**
 * @deprecated Este archivo está obsoleto. 
 * Utilizar la instancia de Alova de frontend/src/lib/api.ts en su lugar.
 * Este archivo se mantiene temporalmente para compatibilidad con código existente.
 */

// Importamos solo la instancia de Alova
import alovaInstanteFromLib from '../lib/api';

// Re-exportamos todo desde lib/api.ts
export * from '../lib/api';
export default alovaInstanteFromLib;

// Advertencia sobre el uso del código obsoleto
console.warn('⚠️ El archivo alova.config.ts está obsoleto, usar lib/api.ts en su lugar'); 