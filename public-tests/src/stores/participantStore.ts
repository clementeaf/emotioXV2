import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ParticipantFlowStep } from '../types/flow';

export interface ModuleResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  stepTitle: string;
  stepType: string;
  response: unknown;
  participantId?: string;
  researchId?: string;
}

export interface ResponsesData {
  participantId?: string;
  researchId: string;
  startTime: number;
  endTime?: number;
  modules: {
    demographic?: ModuleResponse;
    feedback?: ModuleResponse;
    welcome?: ModuleResponse;
    eye_tracking: ModuleResponse[];
    cognitive_task: ModuleResponse[];
    smartvoc: ModuleResponse[];
    all_steps: ModuleResponse[];
    [key: string]: ModuleResponse | ModuleResponse[] | undefined;
  };
}

export interface ExpandedStep {
  id: string;
  name: string;
  type: string;
  config?: { [key: string]: unknown };
}

export interface ParticipantInfo {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface ParticipantState {
  researchId: string | null;
  token: string | null;
  participantId: string | null;
  error: string | null;
  isFlowLoading: boolean;
  currentStep: ParticipantFlowStep;
  expandedSteps: ExpandedStep[];
  currentStepIndex: number;
  maxVisitedIndex: number;
  completedRelevantSteps: number;
  totalRelevantSteps: number;
  responsesData: ResponsesData;
  setResearchId: (id: string | null) => void;
  setToken: (token: string | null) => void;
  setParticipant: (participant: ParticipantInfo) => void;
  setError: (error: string | null) => void;
  setCurrentStep: (step: ParticipantFlowStep) => void;
  setCurrentStepIndex: (index: number) => void;
  setExpandedSteps: (steps: ExpandedStep[]) => void;
  setIsFlowLoading: (loading: boolean) => void;

  // Métodos de flujo
  handleLoginSuccess: (participant: ParticipantInfo) => void;
  goToNextStep: (answer?: unknown) => void;
  navigateToStep: (targetIndex: number) => void;

  // Métodos de respuestas
  saveStepResponse: (stepIndex: number, answer: unknown) => void;
  getStepResponse: (stepIndex: number) => unknown;
  hasStepBeenAnswered: (stepIndex: number) => boolean;
  getAnsweredStepIndices: () => number[];
  getResponsesJson: () => string;

  // <<< NUEVA ACCIÓN >>>
  setLoadedResponses: (loadedStepResponses: ModuleResponse[]) => void;

  // Limpieza de datos
  cleanupPreviousParticipantData: (currentResearchId: string, currentParticipantId: string) => void;

  // Reset y utilidades
  clearAllResponses: () => void;
  resetStore: () => void;
  calculateProgress: () => void;
}

// Función auxiliar para sanear objetos antes de JSON.stringify
const sanitizeForJSON = (obj: unknown): unknown => {
  if (!obj) return obj;

  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(obj, (key, value) => {
    // Ignorar propiedades que empiezan con "__react" (internas de React)
    if (key.startsWith('__react')) return undefined;

    // Manejar posibles referencias circulares
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Referencia Circular]';
      }
      seen.add(value);

      // Eliminar propiedades específicas que causan problemas
      if (typeof window !== 'undefined' &&
          (value instanceof Element || value instanceof HTMLElement)) {
        return '[Elemento DOM]';
      }

      // Si es un objeto con la propiedad "current" (posible React ref)
      if ('current' in value && typeof window !== 'undefined' &&
          (value.current instanceof Element || value.current instanceof HTMLElement)) {
        return '[React Ref]';
      }
    }

    return value;
  }));
};

// Valores iniciales para el estado de la tienda
const initialResponsesData: ResponsesData = {
  researchId: '',
  startTime: Date.now(),
  modules: {
    eye_tracking: [],
    cognitive_task: [],
    smartvoc: [],
    all_steps: []
  }
};

// Creación de la tienda con persistencia
export const useParticipantStore = create(
  persist<ParticipantState>(
    (set, get) => ({
      researchId: null,
      token: null,
      participantId: null,
      error: null,
      isFlowLoading: true,
      currentStep: ParticipantFlowStep.LOADING_SESSION,
      expandedSteps: [],
      currentStepIndex: 0,
      maxVisitedIndex: 0,
      completedRelevantSteps: 0,
      totalRelevantSteps: 0,
      responsesData: { ...initialResponsesData },

      setResearchId: (id) => set({ researchId: id }),
      setToken: (token) => set({ token }),
      setParticipant: (participant) => {
        set({
          participantId: participant.id,
          error: null
        });
      },
      setError: (error) => set({ error }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentStepIndex: (index) => set((state) => ({
        currentStepIndex: index,
        maxVisitedIndex: Math.max(state.maxVisitedIndex, index)
      })),
      setExpandedSteps: (steps) => {
        set({
          expandedSteps: steps,
          isFlowLoading: !(steps && steps.length > 0)
        });
      },

      // Set loaded responses from API and clean conflicting localStorage
      setLoadedResponses: (loadedStepResponses) => set((state) => {
        const newResponsesData = JSON.parse(JSON.stringify(state.responsesData));
        newResponsesData.participantId = state.participantId || newResponsesData.participantId;

        if (Array.isArray(loadedStepResponses)) {
          const existingSteps = newResponsesData.modules.all_steps || [];
          const combinedSteps = [...existingSteps, ...loadedStepResponses];

          const uniqueSteps = combinedSteps.filter((response, index, self) =>
             response.id && index === self.findIndex((r) => r.id === response.id)
          );

          newResponsesData.modules = {
            ...newResponsesData.modules,
            all_steps: uniqueSteps,
          };
        } else {
           console.warn("[ParticipantStore] setLoadedResponses esperaba un array pero recibió:", loadedStepResponses);
        }

        return { responsesData: newResponsesData };
      }),

      // Método para manejar el login exitoso
      handleLoginSuccess: (participant) => {
        const { researchId } = get();
        if (!researchId) return;

        // Limpiar localStorage de participantes anteriores para esta investigación
        get().cleanupPreviousParticipantData(researchId, participant.id);

        // Guardar token en localStorage
        const storedToken = localStorage.getItem('participantToken');
        if (storedToken) {
          // Crear datos de respuesta limpios para el nuevo participante
          const freshResponsesData = {
            participantId: participant.id,
            researchId: researchId,
            startTime: Date.now(),
            modules: {
              eye_tracking: [],
              cognitive_task: [],
              smartvoc: [],
              all_steps: []
            }
          };

          set({
            token: storedToken,
            participantId: participant.id,
            error: null,
            isFlowLoading: true,
            currentStep: ParticipantFlowStep.LOADING_SESSION,
            responsesData: freshResponsesData
          });
        } else {
          set({
            error: "Error interno post-login: Falta token o ID.",
            currentStep: ParticipantFlowStep.ERROR,
            isFlowLoading: false
          });
        }
      },

      // Función para limpiar datos de participantes anteriores
      cleanupPreviousParticipantData: (currentResearchId: string, currentParticipantId: string) => {
        try {
          const storedInfo = localStorage.getItem('participantInfo') as string | null;

          // Si hay datos almacenados de un participante diferente, limpiarlos
          if (storedInfo &&
              (storedInfo.split('|')[0] !== currentResearchId ||
               storedInfo.split('|')[1] !== currentParticipantId)) {
            localStorage.removeItem('participantResponses');
            localStorage.removeItem('expandedSteps');
            localStorage.removeItem('progress');
            localStorage.removeItem('maxVisitedIndex');
            localStorage.removeItem('currentStepIndex');

            // Buscar y eliminar todas las respuestas individuales
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.startsWith('response_') || key.startsWith('maxVisitedIndex_'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
          }
        } catch (e) {
          console.error('[ParticipantStore] Error limpiando datos anteriores:', e);
        }
      },

      // Método para guardar una respuesta
      saveStepResponse: (stepIndex, answer) => {
        const { expandedSteps } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return;

        const stepInfo = expandedSteps[stepIndex];
        const { type: stepType, name: stepName } = stepInfo;
        const id = stepInfo.id;

        // Ignorar welcome/thankyou si no tienen respuesta
        if ((stepType === 'welcome' || stepType === 'thankyou') && answer === undefined) {
          return;
        }

        // Forzar valores para cognitive, smartvoc y eye-tracking
        const isCognitive = stepType.startsWith('cognitive_');
        const isSmartVOC = stepType.startsWith('smartvoc_');
        const isEyeTracking = stepType.startsWith('eye_tracking_');

        if (answer === undefined && (isCognitive || isSmartVOC || isEyeTracking)) {
          answer = isCognitive ? { text: "" } : isSmartVOC ? { value: 0 } : isEyeTracking ? { data: [] } : { value: null };
        }

        // Crear objeto de respuesta
        const moduleResponse: ModuleResponse = {
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stepTitle: stepName || '',
          stepType,
          response: sanitizeForJSON(answer),
          participantId: get().participantId ?? undefined,
          researchId: get().researchId ?? undefined
        };

        // Verificar sanitización
        if (moduleResponse.response === undefined || moduleResponse.response === null) {
          console.warn('[ParticipantStore] ALERTA: Respuesta perdida después de sanitizar');
          moduleResponse.response = isCognitive
            ? { text: "Respuesta no capturada correctamente" }
            : isSmartVOC
              ? { value: 0 }
              : isEyeTracking
                ? { data: [] }
                : "Respuesta no capturada correctamente";
        }

        // Actualizar el estado de forma inmutable
        set(state => {
          const updatedData = { ...state.responsesData };

          // 1. Guardar en categoría específica
          if (stepType === 'demographic') {
            updatedData.modules.demographic = moduleResponse;
          }
          else if (stepName?.includes('Que te ha parecido el módulo')) {
            updatedData.modules.feedback = moduleResponse;
          }
          else if (stepType === 'welcome' && answer !== undefined) {
            updatedData.modules.welcome = moduleResponse;
          }
          else if (isCognitive) {
            if (!updatedData.modules.cognitive_task) {
              updatedData.modules.cognitive_task = [];
            }

            // Verificar si ya existe
            const existingIndex = updatedData.modules.cognitive_task.findIndex(
              resp => resp.id === id
            );

            if (existingIndex >= 0) {
              updatedData.modules.cognitive_task[existingIndex] = moduleResponse;
            } else {
              updatedData.modules.cognitive_task.push(moduleResponse);
            }
          }
          else if (isSmartVOC) {
            if (!updatedData.modules.smartvoc) {
              updatedData.modules.smartvoc = [];
            }

            // Verificar si ya existe
            const existingIndex = updatedData.modules.smartvoc.findIndex(
              resp => resp.id === id
            );

            if (existingIndex >= 0) {
              updatedData.modules.smartvoc[existingIndex] = moduleResponse;
            } else {
              updatedData.modules.smartvoc.push(moduleResponse);
            }
          }
          else if (isEyeTracking) {
            if (!updatedData.modules.eye_tracking) {
              updatedData.modules.eye_tracking = [];
            }

            // Verificar si ya existe
            const existingIndex = updatedData.modules.eye_tracking.findIndex(
              resp => resp.id === id
            );

            if (existingIndex >= 0) {
              updatedData.modules.eye_tracking[existingIndex] = moduleResponse;
            } else {
              updatedData.modules.eye_tracking.push(moduleResponse);
            }
          }
          else {
            // Otros tipos
            const moduleCategory = stepType.split('_')[0] || 'other';
            if (!updatedData.modules[moduleCategory]) {
              updatedData.modules[moduleCategory] = [];
            }

            // Asegurar que es array
            if (!Array.isArray(updatedData.modules[moduleCategory])) {
              updatedData.modules[moduleCategory] = [updatedData.modules[moduleCategory] as ModuleResponse];
            }

            (updatedData.modules[moduleCategory] as ModuleResponse[]).push(moduleResponse);
          }

          // 2. Siempre guardar en all_steps
          if (!updatedData.modules.all_steps) {
            updatedData.modules.all_steps = [];
          }

          // Verificar si ya existe
          const allStepsIndex = updatedData.modules.all_steps.findIndex(
            resp => resp.id === id
          );

          if (allStepsIndex >= 0) {
            updatedData.modules.all_steps[allStepsIndex] = moduleResponse;
          } else {
            updatedData.modules.all_steps.push(moduleResponse);
          }

          return { responsesData: updatedData };
        });

        // Actualizar expandedSteps para mantener las respuestas en la configuración
        set(state => {
          const newSteps = [...state.expandedSteps];
          const targetStep = newSteps[stepIndex];

          if (targetStep) {
            targetStep.config = {
              ...(typeof targetStep.config === 'object' && targetStep.config !== null ? targetStep.config : {}),
              savedResponses: answer
            };
          }

          return { expandedSteps: newSteps };
        });

        // Recalcular progreso
        get().calculateProgress();
      },

      // Avanzar al siguiente paso
      goToNextStep: (answer) => set((state) => {
        const { currentStepIndex, expandedSteps } = state;

        // Guardar la respuesta si se proporciona
        if (answer !== undefined) {
          state.saveStepResponse(currentStepIndex, answer);
        }

        const nextIndex = currentStepIndex + 1;

        if (nextIndex < expandedSteps.length) {
          return {
            currentStepIndex: nextIndex,
            maxVisitedIndex: Math.max(state.maxVisitedIndex, nextIndex)
          };
        } else {
          // Si es el último paso, marcar como finalizado
          return { currentStep: ParticipantFlowStep.DONE };
        }
      }),

      // Navegar a un paso específico
      navigateToStep: (targetIndex) => set((state) => {
        if (targetIndex >= 0 && targetIndex < state.expandedSteps.length && targetIndex <= state.maxVisitedIndex) {
          const { currentStepIndex, expandedSteps, isFlowLoading, maxVisitedIndex } = state;

          // Obtener pasos respondidos
          const answeredSteps = state.getAnsweredStepIndices();
          const isAnsweredStep = answeredSteps.includes(targetIndex);
          // Validaciones individuales con logs detallados
          const validaciones = {
            isFlowLoading,
            targetIndexNegativo: targetIndex < 0,
            targetIndexFueraDeRango: targetIndex >= expandedSteps.length,
            targetIndexMayorQueMaxVisited: targetIndex > maxVisitedIndex,
            noEsStepRespondido: !isAnsweredStep
          };

          const condicionBloqueo = targetIndex > maxVisitedIndex && !isAnsweredStep;

          // Validar navegación
          if (isFlowLoading ||
              targetIndex < 0 ||
              targetIndex >= expandedSteps.length ||
              (targetIndex > maxVisitedIndex && !isAnsweredStep)) {

            // No-op si el índice es el actual
            if (targetIndex !== currentStepIndex) {
              console.warn(`❌ [ParticipantStore] Navegación bloqueada al índice ${targetIndex}.`, {
                razon: isFlowLoading ? 'flujo-cargando' :
                       targetIndex < 0 ? 'indice-negativo' :
                       targetIndex >= expandedSteps.length ? 'indice-fuera-de-rango' :
                       condicionBloqueo ? 'paso-no-visitado-ni-respondido' : 'razon-desconocida',
                detalles: validaciones
              });
            }
            return state;
          }

          const savedResponse = state.getStepResponse(targetIndex);

          // Actualizar config con la respuesta guardada
          if (savedResponse !== null && savedResponse !== undefined) {
            return {
              currentStepIndex: targetIndex,
              error: null,
              expandedSteps: expandedSteps.map((step, index) =>
                index === targetIndex ? {
                  ...step,
                  config: {
                    ...(typeof step.config === 'object' && step.config !== null ? step.config : {}),
                    savedResponses: savedResponse
                  }
                } : step
              )
            };
          }

          // Actualizar índice actual
          return { currentStepIndex: targetIndex, error: null };
        }
        return state;
      }),

      // Obtener índices de pasos respondidos
      getAnsweredStepIndices: () => {
        const { expandedSteps, responsesData, maxVisitedIndex } = get();
        const completedStepIndices = new Set<number>();

        const allApiResponses = responsesData.modules.all_steps || [];

        if (!Array.isArray(allApiResponses)) {
            console.warn("[getAnsweredStepIndices] responsesData.modules.all_steps no es un array válido.");
            for (let i = 0; i <= maxVisitedIndex; i++) { completedStepIndices.add(i); }
            return Array.from(completedStepIndices).sort((a, b) => a - b);
        }

        expandedSteps.forEach((step, index) => {
          // <<< Usar step.name para comparar con apiResponse.stepTitle >>>
          const { type: stepType, name: stepName } = step;

          if (stepType === 'welcome' || stepType === 'thankyou') {
            completedStepIndices.add(index);
            return;
          }

          // <<< MODIFICADO: Buscar en allApiResponses usando stepName/stepTitle >>>
          const encontrado = allApiResponses.some(resp => resp.stepTitle === stepName);
          if (encontrado) {
            completedStepIndices.add(index);
          }
        });

        // Marcar todos los pasos hasta maxVisitedIndex como completados/visitados
        const stepsPorMaxVisited = [];
        for (let i = 0; i <= maxVisitedIndex; i++) {
          if (!completedStepIndices.has(i)) {
            stepsPorMaxVisited.push(i);
          }
          completedStepIndices.add(i);
        }

        const resultado = Array.from(completedStepIndices).sort((a, b) => a - b);

        return resultado;
      },

      // Obtener respuesta de un paso
      getStepResponse: (stepIndex) => {
        const { expandedSteps, responsesData } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return null;

        const step = expandedSteps[stepIndex];
        // <<< Usar step.name para comparar con apiResponse.stepTitle >>>
        const { type: stepType, name: stepName } = step;

        if (stepType === 'welcome' || stepType === 'thankyou') return null;

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[getStepResponse] responsesData.modules.all_steps no es un array válido.");
            return null;
        }

        // <<< MODIFICADO: Buscar en allApiResponses usando stepName/stepTitle >>>
        const response = allApiResponses.find(resp => resp.stepTitle === stepName);
        return response ? response.response : null;
      },

      // Verificar si un paso ha sido respondido
      hasStepBeenAnswered: (stepIndex) => {
        const { expandedSteps, responsesData } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;

        const step = expandedSteps[stepIndex];
        // <<< Usar step.name para comparar con apiResponse.stepTitle >>>
        const { type: stepType, name: stepName } = step;

        if (stepType === 'welcome' || stepType === 'thankyou') return true;

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[hasStepBeenAnswered] responsesData.modules.all_steps no es un array válido.");
            return false;
        }

        // <<< MODIFICADO: Buscar en allApiResponses usando stepName/stepTitle >>>
        return allApiResponses.some(resp => resp.stepTitle === stepName);
      },

      // Obtener JSON de respuestas - ONLY use API data, ignore localStorage
      getResponsesJson: () => {
        const current = get().responsesData;
        return JSON.stringify(current, null, 2);
      },

      // Calcular progreso para barra de progreso
      calculateProgress: () => {
        const { expandedSteps, currentStepIndex, currentStep } = get();

        // Total sin Welcome/Thankyou
        const totalRelevantSteps = Math.max(0, expandedSteps.length - 2);

        let completedRelevantSteps = 0;
        if (currentStepIndex > 0 && expandedSteps.length > 2) {
          // Si estamos después de welcome y hay pasos relevantes
          completedRelevantSteps = Math.min(currentStepIndex, totalRelevantSteps);

          // Si estamos en el último paso (Thankyou), todos los relevantes están completados
          if (currentStepIndex === expandedSteps.length - 1) {
            completedRelevantSteps = totalRelevantSteps;
          }
        }

        // Si el flujo ha terminado, todos completados
        if (currentStep === ParticipantFlowStep.DONE) {
          completedRelevantSteps = totalRelevantSteps;
        }

        set({ completedRelevantSteps, totalRelevantSteps });

        // Guardar progreso en localStorage
        localStorage.setItem('progress', JSON.stringify({ completedRelevantSteps, totalRelevantSteps }));
      },

      // Limpiar solo las respuestas manteniendo la sesión
      clearAllResponses: () => {
        // Limpiar localStorage de respuestas específicas
        try {
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
              key.startsWith('response_') ||
              key === 'participantResponses' ||
              key === 'progress'
            )) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
          console.error('[ParticipantStore] Error limpiando localStorage de respuestas:', e);
        }

        // Resetear solo los datos de respuestas en el store
        const currentState = get();
        set({
          responsesData: {
            ...initialResponsesData,
            researchId: currentState.researchId || '',
            participantId: currentState.participantId || '',
            startTime: Date.now()
          },
          completedRelevantSteps: 0,
          currentStepIndex: 0, // Volver al inicio
          maxVisitedIndex: 0
        });
      },

      // Resetear tienda
      resetStore: () => {
        // Limpiar localStorage específica
        try {
          localStorage.removeItem('participantResponses');
          localStorage.removeItem('expandedSteps');
          localStorage.removeItem('participantInfo');
          localStorage.removeItem('progress');

          // Buscar y eliminar todas las respuestas individuales
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('response_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (e) {
          console.error('[ParticipantStore] Error limpiando localStorage:', e);
        }

        set({
          token: null,
          participantId: null,
          error: null,
          currentStep: ParticipantFlowStep.LOADING_SESSION,
          expandedSteps: [],
          currentStepIndex: 0,
          maxVisitedIndex: 0,
          isFlowLoading: true,
          completedRelevantSteps: 0,
          totalRelevantSteps: 0,
          responsesData: {
            ...initialResponsesData,
            researchId: get().researchId || '',
            startTime: Date.now()
          }
        });
      },
      setIsFlowLoading: (loading) => {
        set({ isFlowLoading: loading });
      }
    }),
    {
      name: 'participant-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const persistedState = {
          token: state.token,
          researchId: state.researchId,
          participantId: state.participantId,
          maxVisitedIndex: state.maxVisitedIndex,
        };
        return persistedState as unknown as ParticipantState;
      },
      version: 1,
      onRehydrateStorage: () => {
        return (restoredState, error) => {
          if (error) {
            console.error('[ParticipantStore] Error recargando estado de Zustand:', error);
          }

          if (restoredState) {
            try {
              const keysToClean = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                  key.startsWith('response_') ||
                  key === 'participantResponses'
                )) {
                  keysToClean.push(key);
                }
              }

              keysToClean.forEach(key => {
                localStorage.removeItem(key);
              });
            } catch (cleanupError) {
              console.error('[ParticipantStore] Error cleaning localStorage during rehydrate:', cleanupError);
            }
          }
        };
      }
    }
  )
);
