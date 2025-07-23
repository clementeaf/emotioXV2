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
        console.log('[ParticipantStore] ✅ ParticipantId establecido:', id);
      },

      setEmail: (email: string) => {
        set({ email });
        console.log('[ParticipantStore] ✅ Email establecido:', email);
      },

      clearParticipant: () => {
        set({ participantId: null, email: null });
        console.log('[ParticipantStore] 🗑️ Datos de participante limpiados');
      },

      getParticipantId: () => {
        const currentId = get().participantId;
        if (!currentId) {
          // 🎯 GENERAR NUEVO ID SI NO EXISTE
          const newId = `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          set({ participantId: newId });
          console.log('[ParticipantStore] 🆔 Nuevo participantId generado:', newId);
          return newId;
        }
        return currentId;
      }
    }),
    {
      name: 'emotio-participant-data',
      partialize: (state) => ({
        participantId: state.participantId,
        email: state.email
      })
    }
  )
);
