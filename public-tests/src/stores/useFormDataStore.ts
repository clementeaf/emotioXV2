import { create } from 'zustand';

interface FormDataState {
  formData: Record<string, any>;
  setFormData: (questionKey: string, data: any) => void;
  getFormData: (questionKey: string) => any;
  clearFormData: (questionKey: string) => void;
  clearAllFormData: () => void;
}

export const useFormDataStore = create<FormDataState>((set, get) => ({
  formData: {},

  setFormData: (questionKey: string, data: any) => {
    set((state) => ({
      formData: {
        ...state.formData,
        [questionKey]: data
      }
    }));
  },

  getFormData: (questionKey: string) => {
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
