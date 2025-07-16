/**
 * 🧪 STORE SIMPLIFICADO PARA PASOS
 */

import { create } from 'zustand';

interface StepStore {
  currentQuestionKey: string;
  setCurrentQuestionKey: (questionKey: string) => void;
  getCurrentQuestionKey: () => string;
}

export const useStepStore = create<StepStore>((set, get) => ({
  currentQuestionKey: '',

  setCurrentQuestionKey: (questionKey: string) => {
    set({ currentQuestionKey: questionKey });
  },

  getCurrentQuestionKey: () => {
    return get().currentQuestionKey;
  },
}));
