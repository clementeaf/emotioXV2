/**
 * 🧪 STORE SIMPLIFICADO PARA PASOS
 */

import { create } from 'zustand';

export interface Step {
  questionKey: string;
  title: string;
  completed: boolean;
  current: boolean;
}

export interface StepStore {
  // Estado actual
  currentQuestionKey: string;

  // Lista completa de steps
  steps: Step[];
  totalSteps: number;

  // Métodos de control
  setCurrentQuestionKey: (questionKey: string) => void;
  getCurrentQuestionKey: () => string;

  // Métodos para steps
  setSteps: (steps: Step[]) => void;
  getSteps: () => Step[];
  getStep: (questionKey: string) => Step | undefined;
  getCurrentStep: () => Step | undefined;
  getNextStep: () => Step | undefined;
  getPreviousStep: () => Step | undefined;

  // Navegación
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (questionKey: string) => void;

  // Marcar step como completado y navegar al siguiente
  completeCurrentStepAndGoNext: () => void;

  // Inicializar store basado en respuestas del backend
  initializeFromBackendResponses: (responses: Array<{ questionKey: string }>) => void;

  // Persistencia en localStorage (Regla #5)
  saveCurrentStepToLocalStorage: () => void;
  getPendingStepFromLocalStorage: () => string | null;
  clearPendingStepFromLocalStorage: () => void;

  // Utilidades
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

// Constantes para localStorage
const PENDING_STEP_KEY = 'emotio_pending_step';
const PENDING_STEP_TIMESTAMP_KEY = 'emotio_pending_step_timestamp';
const PENDING_STEP_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export const useStepStore = create<StepStore>((set, get) => ({
  currentQuestionKey: '',
  steps: [],
  totalSteps: 0,

  setCurrentQuestionKey: (questionKey: string) => {
    console.log('[useStepStore] setCurrentQuestionKey:', questionKey);
    set({ currentQuestionKey: questionKey });
  },

  getCurrentQuestionKey: () => {
    return get().currentQuestionKey;
  },

  setSteps: (newSteps: Step[]) => {
    // Regla #1: Si es la primera vez, activar el primer step y deshabilitar el resto
    const stepsWithInitialState = newSteps.map((step, index) => ({
      ...step,
      current: index === 0, // Solo el primer step está activo
      completed: false // Ningún step está completado inicialmente
    }));

    // Establecer el primer step como currentQuestionKey
    const firstStepKey = stepsWithInitialState[0]?.questionKey || '';

    set({
      steps: stepsWithInitialState,
      totalSteps: stepsWithInitialState.length,
      currentQuestionKey: firstStepKey
    });

    console.log('[useStepStore] Steps inicializados:', {
      totalSteps: stepsWithInitialState.length,
      firstStepKey,
      steps: stepsWithInitialState.map(s => ({ questionKey: s.questionKey, current: s.current }))
    });
  },

  getSteps: () => {
    return get().steps;
  },

  getStep: (questionKey: string) => {
    const state = get();
    return state.steps.find(step => step.questionKey === questionKey);
  },

  getCurrentStep: () => {
    const state = get();
    return state.steps.find(step => step.questionKey === state.currentQuestionKey);
  },

  getNextStep: () => {
    const state = get();
    const currentIndex = state.steps.findIndex(step => step.questionKey === state.currentQuestionKey);
    if (currentIndex >= 0 && currentIndex < state.steps.length - 1) {
      return state.steps[currentIndex + 1];
    }
    return undefined;
  },

  getPreviousStep: () => {
    const state = get();
    const currentIndex = state.steps.findIndex(step => step.questionKey === state.currentQuestionKey);
    if (currentIndex > 0) {
      return state.steps[currentIndex - 1];
    }
    return undefined;
  },

  goToNextStep: () => {
    const state = get();
    const nextStep = state.getNextStep();
    if (nextStep) {
      state.setCurrentQuestionKey(nextStep.questionKey);
    }
  },

  goToPreviousStep: () => {
    const state = get();
    const previousStep = state.getPreviousStep();
    if (previousStep) {
      state.setCurrentQuestionKey(previousStep.questionKey);
    }
  },

  goToStep: (questionKey: string) => {
    const state = get();
    const step = state.getStep(questionKey);
    if (step) {
      state.setCurrentQuestionKey(questionKey);
    }
  },

  // Marcar step como completado y navegar al siguiente
  completeCurrentStepAndGoNext: () => {
    const state = get();
    const currentStep = state.getCurrentStep();
    const nextStep = state.getNextStep();
    if (currentStep && nextStep) {
      // Encontrar el índice del siguiente step
      const nextIndex = state.steps.findIndex(s => s.questionKey === nextStep.questionKey);
      // Todos los steps antes del siguiente deben estar en verde
      const updatedSteps = state.steps.map((step, idx) => ({
        ...step,
        completed: idx < nextIndex, // Todos los anteriores al azul en verde
        current: idx === nextIndex  // Solo el siguiente en azul
      }));
      set({
        steps: updatedSteps,
        currentQuestionKey: nextStep.questionKey
      });
      console.log('[useStepStore] Step completado y navegando:', {
        completedHasta: nextIndex - 1,
        next: nextStep.questionKey
      });
    }
  },

  // Inicializar store basado en respuestas del backend
  initializeFromBackendResponses: (responses: Array<{ questionKey: string }>) => {
    const state = get();
    if (state.steps.length === 0) {
      console.log('[useStepStore] No hay steps para inicializar');
      return;
    }

    const completedQuestionKeys = responses.map(r => r.questionKey);
    const stepOrder = state.steps.map(s => s.questionKey);

    // Obtener el último step respondido del backend
    let lastCompletedIndex = -1;
    for (let i = stepOrder.length - 1; i >= 0; i--) {
      if (completedQuestionKeys.includes(stepOrder[i])) {
        lastCompletedIndex = i;
        break;
      }
    }

    // Obtener el step pendiente del localStorage
    const pendingStep = state.getPendingStepFromLocalStorage();
    let stepToActivate = stepOrder[lastCompletedIndex + 1] || stepOrder[0]; // Por defecto, el siguiente al último completado

    // Si hay un step pendiente en localStorage, verificar si es posterior al último respondido
    if (pendingStep) {
      const pendingIndex = stepOrder.indexOf(pendingStep);
      if (pendingIndex > lastCompletedIndex) {
        stepToActivate = pendingStep;
        console.log('[useStepStore] Usando step pendiente de localStorage:', pendingStep);
      } else {
        console.log('[useStepStore] Step pendiente es anterior al último respondido, ignorando');
        state.clearPendingStepFromLocalStorage();
      }
    }

    // Actualizar los steps
    const updatedSteps = state.steps.map((step, idx) => ({
      ...step,
      completed: idx <= lastCompletedIndex,
      current: step.questionKey === stepToActivate
    }));

    set({
      steps: updatedSteps,
      currentQuestionKey: stepToActivate
    });

    console.log('[useStepStore] Inicializado desde backend + localStorage:', {
      responses: completedQuestionKeys,
      lastCompletedIndex,
      pendingStep,
      stepToActivate,
      updatedSteps: updatedSteps.map(s => ({ questionKey: s.questionKey, completed: s.completed, current: s.current }))
    });
  },

  // Persistencia en localStorage (Regla #5)
  saveCurrentStepToLocalStorage: () => {
    const state = get();
    const currentQuestionKey = state.currentQuestionKey;
    if (currentQuestionKey) {
      localStorage.setItem(PENDING_STEP_KEY, currentQuestionKey);
      localStorage.setItem(PENDING_STEP_TIMESTAMP_KEY, Date.now().toString());
      console.log('[useStepStore] Step guardado en localStorage:', currentQuestionKey);
    }
  },

  getPendingStepFromLocalStorage: () => {
    const pendingStep = localStorage.getItem(PENDING_STEP_KEY);
    const timestamp = localStorage.getItem(PENDING_STEP_TIMESTAMP_KEY);

    if (!pendingStep || !timestamp) {
      return null;
    }

    const timestampNum = parseInt(timestamp);
    const now = Date.now();
    const isExpired = (now - timestampNum) > PENDING_STEP_DURATION;

    if (isExpired) {
      console.log('[useStepStore] Step en localStorage expirado, limpiando');
      localStorage.removeItem(PENDING_STEP_KEY);
      localStorage.removeItem(PENDING_STEP_TIMESTAMP_KEY);
      return null;
    }

    console.log('[useStepStore] Step pendiente encontrado en localStorage:', pendingStep);
    return pendingStep;
  },

  clearPendingStepFromLocalStorage: () => {
    localStorage.removeItem(PENDING_STEP_KEY);
    localStorage.removeItem(PENDING_STEP_TIMESTAMP_KEY);
    console.log('[useStepStore] Step pendiente limpiado de localStorage');
  },

  isFirstStep: () => {
    const state = get();
    const currentStep = state.getCurrentStep();
    return currentStep ? state.steps.indexOf(currentStep) === 0 : false;
  },

  isLastStep: () => {
    const state = get();
    const currentStep = state.getCurrentStep();
    return currentStep ? state.steps.indexOf(currentStep) === state.steps.length - 1 : false;
  },

  canGoNext: () => {
    const state = get();
    return state.getNextStep() !== undefined;
  },

  canGoPrevious: () => {
    const state = get();
    return state.getPreviousStep() !== undefined;
  }
}));
