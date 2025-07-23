import { create } from 'zustand';

export type StepState = 'active' | 'completed' | 'disabled' | 'available';

export interface StepStateInfo {
  state: StepState;
  hasResponse: boolean;
  canAccess: boolean;
  isCurrentStep: boolean;
}

export interface Step {
  questionKey: string;
  title: string;
}

export interface StepStore {
  // 🎯 UNA SOLA FUENTE DE VERDAD
  backendResponses: any[];
  steps: Step[];
  currentQuestionKey: string;

  // 🎯 MÉTODOS ESENCIALES
  setCurrentQuestionKey: (questionKey: string) => void;
  setSteps: (steps: Step[]) => void;
  updateBackendResponses: (responses: any[]) => void;
  resetStore: () => void;

  // 🎯 CÁLCULOS DINÁMICOS
  hasBackendResponse: (questionKey: string) => boolean;
  canAccessStep: (stepIndex: number) => boolean;
  getStepState: (stepIndex: number) => StepStateInfo;
  getInitialStep: () => string;

  // 🎯 ESTADOS CALCULADOS
  getTotalResponses: () => number;
  getLastCompletedStep: () => string | null;
  getNextStep: () => string;
  getCompletedSteps: () => string[];

  // 🎯 MÉTODOS DE COMPATIBILIDAD
  getSteps: () => Step[];
  goToNextStep: () => void;
}

export const useStepStore = create<StepStore>((set, get) => ({
  // 🎯 UNA SOLA FUENTE DE VERDAD
  backendResponses: [],
  steps: [],
  currentQuestionKey: '',

  // 🎯 MÉTODOS ESENCIALES
  setCurrentQuestionKey: (questionKey: string) => {
    console.log('[useStepStore] setCurrentQuestionKey:', questionKey);
    set({ currentQuestionKey: questionKey });
  },

  setSteps: (newSteps: Step[]) => {
    console.log('[useStepStore] setSteps:', newSteps.map(s => s.questionKey));
    set({ steps: newSteps });

    // 🎯 Inicializar step activo si no hay uno
    const state = get();
    if (!state.currentQuestionKey && newSteps.length > 0) {
      const initialStep = state.getInitialStep();
      set({ currentQuestionKey: initialStep });
    }
  },

  updateBackendResponses: (responses: any[]) => {
    const validResponses = responses.filter(response =>
      response && typeof response === 'object' && response.questionKey
    );

    console.log('[useStepStore] 📊 ACTUALIZANDO RESPONSAS:', {
      responses: validResponses.map(r => r.questionKey),
      currentQuestionKey: get().currentQuestionKey
    });

    // 🎯 ENCONTRAR STEP ACTIVO basado en respuestas
    const state = get();
    const stepOrder = state.steps.map(s => s.questionKey);
    let activeStepIndex = 0;

    for (let i = 0; i < stepOrder.length; i++) {
      if (!validResponses.some(r => r.questionKey === stepOrder[i])) {
        activeStepIndex = i;
        break;
      }
    }

    if (activeStepIndex === 0 && validResponses.length === stepOrder.length) {
      activeStepIndex = stepOrder.length - 1;
    }

    const stepToActivate = stepOrder[activeStepIndex] || '';

    set({
      backendResponses: validResponses,
      currentQuestionKey: stepToActivate
    });

    console.log('[useStepStore] ✅ Store actualizado:', {
      totalResponses: validResponses.length,
      stepToActivate,
      responses: validResponses.map(r => r.questionKey)
    });
  },

  resetStore: () => {
    const state = get();
    const firstStepKey = state.steps[0]?.questionKey || '';
    console.log('[useStepStore] 🔄 RESETEANDO STORE');
    set({
      backendResponses: [],
      currentQuestionKey: firstStepKey
    });
  },

  // 🎯 CÁLCULOS DINÁMICOS
  hasBackendResponse: (questionKey: string): boolean => {
    const state = get();
    return state.backendResponses.some(response => response.questionKey === questionKey);
  },

  canAccessStep: (stepIndex: number): boolean => {
    const state = get();
    if (stepIndex === 0) return true;

    if (stepIndex >= state.steps.length) return false;

    const step = state.steps[stepIndex];
    if (!step) return false;

    // 🎯 PERMITIR ACCESO A TODOS LOS STEPS COMPLETADOS
    if (state.hasBackendResponse(step.questionKey)) return true;

    // 🎯 PERMITIR ACCESO SOLO SI EL STEP ANTERIOR ESTÁ COMPLETADO
    const previousStep = state.steps[stepIndex - 1];
    if (previousStep && state.hasBackendResponse(previousStep.questionKey)) {
      return true;
    }

    // 🎯 NO PERMITIR ACCESO A STEPS POSTERIORES SIN COMPLETAR EL ANTERIOR
    return false;
  },

  getStepState: (stepIndex: number): StepStateInfo => {
    const state = get();
    const step = state.steps[stepIndex];
    if (!step) return {
      state: 'disabled' as StepState,
      canAccess: false,
      hasResponse: false,
      isCurrentStep: false
    };

    const hasResponse = state.hasBackendResponse(step.questionKey);
    const canAccess = state.canAccessStep(stepIndex);
    const isCurrentStep = step.questionKey === state.currentQuestionKey;

    let stateType: StepState;
    if (isCurrentStep) {
      stateType = 'active';
    } else if (hasResponse) {
      stateType = 'completed';
    } else if (!canAccess) {
      stateType = 'disabled';
    } else {
      stateType = 'available';
    }

    return {
      state: stateType,
      hasResponse,
      canAccess,
      isCurrentStep
    };
  },

  getInitialStep: (): string => {
    const state = get();
    if (state.steps.length === 0) return '';

    const firstUnansweredStep = state.steps.find(step => !state.hasBackendResponse(step.questionKey));
    return firstUnansweredStep?.questionKey || state.steps[0]?.questionKey || '';
  },

  // 🎯 ESTADOS CALCULADOS
  getTotalResponses: () => {
    return get().backendResponses.length;
  },

  getLastCompletedStep: () => {
    const state = get();
    const completedKeys = state.backendResponses.map(r => r.questionKey);
    return completedKeys.length > 0 ? completedKeys[completedKeys.length - 1] : null;
  },

  getNextStep: () => {
    const state = get();
    const stepOrder = state.steps.map(s => s.questionKey);
    const completedKeys = state.backendResponses.map(r => r.questionKey);

    for (let i = 0; i < stepOrder.length; i++) {
      if (!completedKeys.includes(stepOrder[i])) {
        return stepOrder[i];
      }
    }

    return stepOrder[stepOrder.length - 1] || '';
  },

  getCompletedSteps: () => {
    return get().backendResponses.map(r => r.questionKey);
  },

  // 🎯 MÉTODOS DE COMPATIBILIDAD
  getSteps: () => {
    return get().steps;
  },

  goToNextStep: () => {
    const state = get();
    const nextStepKey = state.getNextStep();
    if (nextStepKey) {
      state.setCurrentQuestionKey(nextStepKey);
    }
  }
}));
