import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ParticipantState {
  participantId: string | null;
  email: string | null;
  setParticipantId: (id: string) => void;
  setEmail: (email: string) => void;
  clearParticipant: () => void;
  getParticipantId: () => string;
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set, get) => ({
      participantId: null,
      email: null,

      setParticipantId: (id: string) => {
        set({ participantId: id });
      },

      setEmail: (email: string) => {
        set({ email });
      },

      clearParticipant: () => {
        set({ participantId: null, email: null });
      },

      getParticipantId: () => {
        const currentId = get().participantId;
        if (!currentId) {
          const newId = `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          set({ participantId: newId });
          return newId;
        }
        return currentId;
      }
    }),
    {
      // 🎯 CREAR STORAGE KEY DINÁMICO BASADO EN PARTICIPANTE Y RESEARCH
      name: (() => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const participantId = urlParams.get('userId') || localStorage.getItem('userId') || 'default';
          const researchId = urlParams.get('researchId') || localStorage.getItem('researchId') || 'default';
          return `emotio-participant-data-${researchId}-${participantId}`;
        }
        return 'emotio-participant-data-default';
      })(),
      partialize: (state) => ({
        participantId: state.participantId,
        email: state.email
      })
    }
  )
);
