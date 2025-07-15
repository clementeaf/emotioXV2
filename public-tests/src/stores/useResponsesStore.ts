import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LocalResponse {
  questionKey: string;
  response: unknown;
  timestamp: string;
  stepType: string;
  stepTitle: string;
  backendSent: boolean; // NUEVO: Indicar si la respuesta fue enviada al backend
}

interface ResponsesStoreState {
  // Respuestas locales persistidas
  localResponses: Record<string, LocalResponse>;

  // Métodos para manejar respuestas
  saveLocalResponse: (questionKey: string, response: unknown, stepType: string, stepTitle: string) => void;
  getLocalResponse: (questionKey: string) => LocalResponse | null;
  hasLocalResponse: (questionKey: string) => boolean;
  updateLocalResponse: (questionKey: string, response: unknown) => void;
  deleteLocalResponse: (questionKey: string) => void;
  clearAllResponses: () => void;

  // NUEVO: Métodos para verificar respuestas del backend
  markAsBackendSent: (questionKey: string) => void;
  hasBackendResponse: (questionKey: string) => boolean;

  // Métodos de utilidad
  getAllResponses: () => LocalResponse[];
  getResponsesCount: () => number;
}

export const useResponsesStore = create<ResponsesStoreState>()(
  persist(
    (set, get) => ({
      localResponses: {},

      saveLocalResponse: (questionKey: string, response: unknown, stepType: string, stepTitle: string) => {
        set((state) => ({
          localResponses: {
            ...state.localResponses,
            [questionKey]: {
              questionKey,
              response,
              timestamp: new Date().toISOString(),
              stepType,
              stepTitle,
              backendSent: false // NUEVO: Indicar que aún no fue enviado al backend
            }
          }
        }));

        console.log(`[useResponsesStore] ✅ Respuesta guardada localmente: ${questionKey}`);
      },

      getLocalResponse: (questionKey: string) => {
        const state = get();
        return state.localResponses[questionKey] || null;
      },

      hasLocalResponse: (questionKey: string) => {
        const state = get();
        return !!state.localResponses[questionKey];
      },

      updateLocalResponse: (questionKey: string, response: unknown) => {
        set((state) => ({
          localResponses: {
            ...state.localResponses,
            [questionKey]: {
              ...state.localResponses[questionKey],
              response,
              timestamp: new Date().toISOString(),
              backendSent: false // NUEVO: Resetear estado de backend
            }
          }
        }));

        console.log(`[useResponsesStore] ✅ Respuesta actualizada localmente: ${questionKey}`);
      },

      deleteLocalResponse: (questionKey: string) => {
        set((state) => {
          const newResponses = { ...state.localResponses };
          delete newResponses[questionKey];
          return { localResponses: newResponses };
        });

        console.log(`[useResponsesStore] ✅ Respuesta eliminada localmente: ${questionKey}`);
      },

      clearAllResponses: () => {
        set({ localResponses: {} });
        console.log(`[useResponsesStore] ✅ Todas las respuestas eliminadas`);
      },

      // NUEVO: Marcar como enviado al backend
      markAsBackendSent: (questionKey: string) => {
        set((state) => ({
          localResponses: {
            ...state.localResponses,
            [questionKey]: {
              ...state.localResponses[questionKey],
              backendSent: true
            }
          }
        }));

        console.log(`[useResponsesStore] ✅ Marcado como enviado al backend: ${questionKey}`);
      },

      // NUEVO: Verificar si fue enviado al backend
      hasBackendResponse: (questionKey: string) => {
        const state = get();
        const response = state.localResponses[questionKey];
        return response ? response.backendSent : false;
      },

      getAllResponses: () => {
        const state = get();
        return Object.values(state.localResponses);
      },

      getResponsesCount: () => {
        const state = get();
        return Object.keys(state.localResponses).length;
      }
    }),
    {
      name: 'emotio-responses-storage', // Nombre único para localStorage
      partialize: (state) => ({ localResponses: state.localResponses }), // Solo persistir las respuestas
    }
  )
);
