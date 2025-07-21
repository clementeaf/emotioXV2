import { create } from 'zustand';

interface QuotaResult {
  status: 'QUALIFIED' | 'DISQUALIFIED_OVERQUOTA';
  order: number;
  quotaLimit: number;
}

interface FormDataState {
  formData: Record<string, Record<string, unknown>>;
  quotaResult: QuotaResult | null;
  setFormData: (questionKey: string, data: Record<string, unknown>) => void;
  getFormData: (questionKey: string) => Record<string, unknown>;
  clearFormData: (questionKey: string) => void;
  clearAllFormData: () => void;
  setQuotaResult: (result: QuotaResult) => void;
  clearQuotaResult: () => void;
}

export const useFormDataStore = create<FormDataState>((set, get) => ({
  formData: {},
  quotaResult: null,

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
    set({ formData: {}, quotaResult: null });
  },

  setQuotaResult: (result: QuotaResult) => {
    set({ quotaResult: result });
  },

  clearQuotaResult: () => {
    set({ quotaResult: null });
  }
}));
