import { create } from 'zustand';

interface StepStoreState {
  currentStepKey: string;
  setStep: (key: string) => void;
}

export const useStepStore = create<StepStoreState>((set) => ({
  currentStepKey: '',
  setStep: (key) => set({ currentStepKey: key }),
}));
