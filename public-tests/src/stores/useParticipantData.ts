import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ParticipantInfo, ParticipantDataState } from '../types/store.types';

const initialState = {
  researchId: null,
  token: null,
  participantId: null,
  error: null,
};

export const useParticipantData = create(
  persist<ParticipantDataState>(
    (set, get) => ({
      ...initialState,
      
      setResearchId: (id) => set({ researchId: id }),
      
      setToken: (token) => set({ token }),
      
      setParticipant: (participant) => {
        set({ 
          participantId: participant.id,
          error: null // Clear any existing errors
        });
        
        // Save participant info to localStorage for backup
        try {
          localStorage.setItem('participantInfo', JSON.stringify({
            id: participant.id,
            researchId: get().researchId
          }));
        } catch (error) {
          console.error('[ParticipantData] Error saving participant info:', error);
        }
      },
      
      setError: (error) => set({ error }),
      
      reset: () => {
        // Clean localStorage
        try {
          localStorage.removeItem('participantInfo');
        } catch (error) {
          console.error('[ParticipantData] Error cleaning localStorage:', error);
        }
        
        set(initialState);
      }
    }),
    {
      name: 'participant-data-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
); 