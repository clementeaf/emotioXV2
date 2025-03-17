import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ResearchDraft, ResearchStore } from '@/interfaces/research';

// Clave para almacenamiento en localStorage
const DRAFT_STORAGE_KEY = 'research_draft';

// Crear el store con persistencia
export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentDraft: null,
      hasDraft: false,
      
      // Acciones
      createDraft: () => {
        const newDraft: ResearchDraft = {
          id: crypto.randomUUID(),
          step: 'basic',
          data: {},
          lastUpdated: new Date()
        };
        
        set({ 
          currentDraft: newDraft,
          hasDraft: true
        });
        
        return newDraft;
      },
      
      updateDraft: (data, step) => {
        set((state) => {
          if (!state.currentDraft) return state;
          
          const updatedDraft = {
            ...state.currentDraft,
            step,
            data: {
              ...state.currentDraft.data,
              ...data
            },
            lastUpdated: new Date()
          };
          
          return { 
            currentDraft: updatedDraft,
            hasDraft: true
          };
        });
      },
      
      clearDraft: () => {
        set({ 
          currentDraft: null,
          hasDraft: false
        });
      },
      
      getDraft: () => get().currentDraft
    }),
    {
      name: DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ currentDraft: state.currentDraft }),
      // Personalizar cómo se manejan las fechas durante la persistencia
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        // Restaurar las fechas como objetos Date
        if (state.currentDraft?.lastUpdated) {
          state.currentDraft.lastUpdated = new Date(state.currentDraft.lastUpdated);
        }
        
        // Actualizar hasDraft basado en el currentDraft
        state.hasDraft = !!state.currentDraft;
      }
    }
  )
);

// Para mantener compatibilidad con el código existente que usa useResearch
export function useResearch() {
  return useResearchStore();
} 