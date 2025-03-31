/**
 * Archivo principal que exporta el componente WelcomeScreenForm
 * Este archivo se mantiene para compatibilidad pero usa la versión refactorizada
 */

import { WelcomeScreenForm as WelcomeScreenFormComponent } from './WelcomeScreen';

// Re-exportar el componente con el mismo nombre para mantener compatibilidad
export const WelcomeScreenForm = WelcomeScreenFormComponent;

// También exportar como default para que sea compatible con ambos tipos de importación
export default WelcomeScreenForm; 