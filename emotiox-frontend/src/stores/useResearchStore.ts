import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Research } from '../types/api.types';

/**
 * Draft interface for research creation
 */
export interface ResearchDraft {
  id: string;
  step: 'basic' | 'configuration' | 'review';
  data: Record<string, any>;
  lastUpdated: Date;
}

/**
 * Research store interface
 */
export interface ResearchStore {
  items: Research[];
  snapshot?: Research[] | null;
  currentDraft: ResearchDraft | null;
  hasDraft: boolean;
  optimisticAdd: (r: Omit<Research, 'id'> & { clientId: string }) => void;
  reconcileByClientId: (clientId: string, real: Research) => void;
  rollback: () => void;
  createDraft: () => ResearchDraft;
  updateDraft: (data: Record<string, any>, step: string) => void;
  clearDraft: () => void;
  getDraft: () => ResearchDraft | null;
}

/**
 * Helper functions
 */
const newClientId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `tmp_${Date.now()}_${Math.random().toString(36).slice(2,8)}`);

const upsertById = (arr: Research[], item: Research) => {
  const i = arr.findIndex(x => (item.id && x.id === item.id) || (item.clientId && x.clientId === item.clientId));
  if (i === -1) return [item, ...arr];
  const copy = arr.slice(); 
  copy[i] = { ...copy[i], ...item }; 
  return copy;
};

const removeById = (arr: Research[], needle: { id?: string; clientId?: string }) =>
  arr.filter(x => !(needle.id && x.id === needle.id) && !(needle.clientId && x.clientId === needle.clientId));

const DRAFT_STORAGE_KEY = 'research_draft';

/**
 * Research store with Zustand
 */
export const useResearchStore = create<ResearchStore>()(
  persist(
    (set, get) => ({
      items: [],
      snapshot: null,
      currentDraft: null,
      hasDraft: false,
      
      optimisticAdd: (r) => set(s => {
        return { 
          snapshot: s.items, 
          items: upsertById(s.items, { ...r, id: '' }) 
        };
      }),
      
      reconcileByClientId: (clientId, real) => set(s => {
        const withoutTmp = removeById(s.items, { clientId });
        return { 
          items: upsertById(withoutTmp, { ...real, clientId: undefined }) 
        };
      }),
      
      rollback: () => set(s => ({ 
        items: s.snapshot ?? s.items, 
        snapshot: null 
      })),
      
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
            step: step as 'basic' | 'configuration' | 'review',
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
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        
        if (state.currentDraft?.lastUpdated) {
          state.currentDraft.lastUpdated = new Date(state.currentDraft.lastUpdated);
        }
        
        state.hasDraft = !!state.currentDraft;
      }
    }
  )
);

export const researchHelpers = { newClientId, upsertById, removeById };
