/**
 * 🧪 STORE SIMPLIFICADO PARA TEST DE PARTICIPANTE
 *
 * Este store maneja solo el estado local del test, sin lógica de backend.
 * Ideal para testing, demos y desarrollo local.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Tipos simplificados
export interface TestStep {
  id: string;
  type: string;
  name: string;
  completed: boolean;
  current: boolean;
}

export interface TestResponse {
  questionKey: string;
  response: unknown;
  timestamp: string;
  stepType: string;
  stepTitle: string;
}

export interface TestState {
  // Estado del participante
  researchId: string | null;
  participantId: string | null;
  participantName: string | null;
  participantEmail: string | null;

  // Estado del test
  currentStepIndex: number;
  totalSteps: number;
  completedSteps: number;

  // Pasos del test
  steps: TestStep[];

  // Respuestas locales
  responses: Record<string, TestResponse>;

  // Estado de la sesión
  sessionStartTime: number;
  isSessionActive: boolean;

  // Métodos
  setParticipant: (id: string, name: string, email: string, researchId: string) => void;
  setCurrentStep: (index: number) => void;
  setSteps: (steps: TestStep[]) => void;
  completeStep: (stepId: string) => void;
  saveResponse: (questionKey: string, response: unknown, stepType: string, stepTitle: string) => void;
  getResponse: (questionKey: string) => TestResponse | null;
  startSession: () => void;
  endSession: () => void;
  resetTest: () => void;
  getProgress: () => number;
  getCompletedSteps: () => TestStep[];
  getCurrentStep: () => TestStep | null;
  hasResponse: (questionKey: string) => boolean;
  clearResponses: () => void;
}

// Estado inicial
const initialState = {
  researchId: null,
  participantId: null,
  participantName: null,
  participantEmail: null,
  currentStepIndex: 0,
  totalSteps: 0,
  completedSteps: 0,
  steps: [],
  responses: {},
  sessionStartTime: 0,
  isSessionActive: false,
};

// 🎯 PERSIST TO LOCALSTORAGE - Para que sobreviva a recargas de página
export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Establecer información del participante
      setParticipant: (id: string, name: string, email: string, researchId: string) => {
        const state = get();
        
        // 🔒 PREVENIR ACTUALIZACIONES INNECESARIAS
        if (
          state.participantId === id &&
          state.participantName === name &&
          state.participantEmail === email &&
          state.researchId === researchId
        ) {
          return;
        }
        set({
          participantId: id,
          participantName: name,
          participantEmail: email,
          researchId: researchId,
        });
      },

      // Establecer paso actual
      setCurrentStep: (index: number) => {
        const state = get();
        if (index >= 0 && index < state.steps.length) {
          set({
            currentStepIndex: index,
            steps: state.steps.map((step, i) => ({
              ...step,
              current: i === index,
            })),
          });
        }
      },

      // Establecer steps
      setSteps: (newSteps: TestStep[]) => {
        set({
          steps: newSteps,
          totalSteps: newSteps.length,
          currentStepIndex: 0,
          completedSteps: 0,
        });
      },

      // Completar un paso
      completeStep: (stepId: string) => {
        const state = get();
        const updatedSteps = state.steps.map(step =>
          step.id === stepId ? { ...step, completed: true } : step
        );

        const completedCount = updatedSteps.filter(step => step.completed).length;

        set({
          steps: updatedSteps,
          completedSteps: completedCount,
        });
      },

      // Guardar respuesta local
      saveResponse: (questionKey: string, response: unknown, stepType: string, stepTitle: string) => {
        const state = get();
        set({
          responses: {
            ...state.responses,
            [questionKey]: {
              questionKey,
              response,
              timestamp: new Date().toISOString(),
              stepType,
              stepTitle,
            },
          },
        });
      },

      // Obtener respuesta local
      getResponse: (questionKey: string) => {
        const state = get();
        return state.responses[questionKey] || null;
      },

      // Verificar si hay respuesta
      hasResponse: (questionKey: string) => {
        const state = get();
        return !!state.responses[questionKey];
      },

      // Iniciar sesión
      startSession: () => {
        set({
          sessionStartTime: Date.now(),
          isSessionActive: true,
        });
      },

      // Finalizar sesión
      endSession: () => {
        set({
          isSessionActive: false,
        });
      },

      // Reiniciar test
      resetTest: () => {
        set({
          ...initialState,
          sessionStartTime: Date.now(),
          isSessionActive: true,
        });
      },

      // Obtener progreso (0-100)
      getProgress: () => {
        const state = get();
        if (state.totalSteps === 0) return 0;
        return Math.round((state.completedSteps / state.totalSteps) * 100);
      },

      // Obtener pasos completados
      getCompletedSteps: () => {
        const state = get();
        return state.steps.filter(step => step.completed);
      },

      // Obtener paso actual
      getCurrentStep: () => {
        const state = get();
        if (state.currentStepIndex >= 0 && state.currentStepIndex < state.steps.length) {
          return state.steps[state.currentStepIndex];
        }
        return null;
      },

    // Limpiar todas las respuestas
    clearResponses: () => {
      set({ responses: {} });
    },
  }),
    {
      name: 'test-store',
      // Solo persistir los datos críticos del participante y estado básico
      partialize: (state) => ({
        researchId: state.researchId,
        participantId: state.participantId,
        participantName: state.participantName,
        participantEmail: state.participantEmail,
        responses: state.responses,
        currentStepIndex: state.currentStepIndex,
        completedSteps: state.completedSteps,
      }),
    }
  )
);
