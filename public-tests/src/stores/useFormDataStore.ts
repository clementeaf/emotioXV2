import { create } from 'zustand';

interface FormDataState {
  formData: Record<string, Record<string, unknown>>;
  setFormData: (questionKey: string, data: Record<string, unknown>) => void;
  getFormData: (questionKey: string) => Record<string, unknown>;
  clearFormData: (questionKey: string) => void;
  clearAllFormData: () => void;
}

export const useFormDataStore = create<FormDataState>((set, get) => ({
  formData: {},

  setFormData: (questionKey: string, data: Record<string, unknown>) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [questionKey]: data
      }
    }));
  },

  getFormData: (questionKey: string): Record<string, unknown> => {
    return get().formData[questionKey] || {};
  },

  clearFormData: (questionKey: string) => {
    set((state) => {
      const newFormData = { ...state.formData };
      delete newFormData[questionKey];
      return { formData: newFormData };
    });
  },

  clearAllFormData: () => {
    set({ formData: {} });
  }
}));
