import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface QuotaResult {
  status: 'QUALIFIED' | 'DISQUALIFIED_OVERQUOTA';
  order: number;
  quotaLimit: number;
  // 🎯 NUEVO: Propiedades para cuotas dinámicas
  demographicType?: string;
  demographicValue?: string;
  reason?: string;
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

export const useFormDataStore = create<FormDataState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      // 🎯 CREAR STORAGE KEY DINÁMICO BASADO EN PARTICIPANTE Y RESEARCH
      name: (() => {
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const participantId = urlParams.get('userId') || localStorage.getItem('userId') || 'default';
          const researchId = urlParams.get('researchId') || localStorage.getItem('researchId') || 'default';
          return `emotio-form-data-${researchId}-${participantId}`;
        }
        return 'emotio-form-data-default';
      })(),
      partialize: (state) => ({
        formData: state.formData,
        quotaResult: state.quotaResult
      })
    }
  )
);
