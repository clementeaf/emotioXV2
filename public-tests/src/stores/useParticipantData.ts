import { create } from 'zustand';
import { ParticipantDataState } from '../types/store.types';

const initialState = {
  researchId: null,
  token: null,
  participantId: null,
  error: null,
};

export const useParticipantData = create<ParticipantDataState>((set) => ({
  ...initialState,

  setResearchId: (id) => set({ researchId: id }),

  setToken: (token) => set({ token }),

  setParticipant: (participant) => {
    set({
      participantId: participant.id,
      error: null // Clear any existing errors
    });
  },

  setError: (error) => set({ error }),

  reset: () => {
    set(initialState);
  }
}));
