import { create } from 'zustand';

interface PreviewModeState {
  isPreviewMode: boolean;
  setPreviewMode: (isPreview: boolean) => void;
}

/**
 * Store para manejar el modo preview de public-tests
 *
 * - isPreviewMode = true: Modo testing/preview (sin participantId en URL)
 *   → No se guardan respuestas en backend
 *   → Se muestra indicador visual
 *
 * - isPreviewMode = false: Modo producción (con participantId en URL)
 *   → Se guardan respuestas normalmente en backend
 */
export const usePreviewModeStore = create<PreviewModeState>()((set) => ({
  isPreviewMode: true, // Por defecto en modo preview hasta que se detecte participantId

  setPreviewMode: (isPreview: boolean) => {
    set({ isPreviewMode: isPreview });
  },
}));
