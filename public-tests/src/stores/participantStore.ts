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
  getStepResponseById: (stepId: string) => unknown;
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
      setToken: (token) => {
        console.log('[participantStore] setToken llamado con:', token ? 'token presente' : 'token null');
        set({ token });
        // Sincronizar con localStorage
        if (token) {
          localStorage.setItem('participantToken', token);
        } else {
          localStorage.removeItem('participantToken');
        }
      },
      setParticipant: (participant) => {
        console.log('[participantStore] setParticipant llamado con:', participant);
        set({
          participantId: participant.id,
          error: null
        });
      },
      setError: (error) => set({ error }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentStepIndex: (index) => {
        console.log(`[participantStore] 🔄 Solicitud para cambiar el índice del paso a: ${index}`);
        set((state) => {
          if (state.currentStepIndex === index) {
            console.warn(`[participantStore] ⚠️ El índice ya es ${index}. No se realiza ninguna acción.`);
            return state;
          }
          console.log(`[participantStore] ✅ Índice del paso actualizado de ${state.currentStepIndex} a ${index}.`);
          return {
            currentStepIndex: index,
            maxVisitedIndex: Math.max(state.maxVisitedIndex, index),
          };
        });
      },
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

      // Método para manejar el éxito del login
      handleLoginSuccess: (participant) => {
        console.log('[participantStore] handleLoginSuccess llamado con:', participant);
        const researchId = get().researchId;

        if (!researchId) {
          console.error('[participantStore] handleLoginSuccess: No hay researchId en el store');
          set({
            error: "Error interno post-login: Falta researchId.",
            currentStep: ParticipantFlowStep.ERROR,
            isFlowLoading: false
          });
          return;
        }

        // Limpiar localStorage de participantes anteriores para esta investigación
        get().cleanupPreviousParticipantData(researchId, participant.id);

        // Obtener token desde localStorage
        const storedToken = localStorage.getItem('participantToken');
        console.log('[participantStore] Token obtenido de localStorage:', storedToken ? 'presente' : 'ausente');

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

          console.log('[participantStore] Configurando store con token y participante');
          set({
            token: storedToken,
            participantId: participant.id,
            error: null,
            isFlowLoading: true,
            currentStep: ParticipantFlowStep.LOADING_SESSION,
            responsesData: freshResponsesData
          });
        } else {
          console.error('[participantStore] No se encontró token en localStorage');
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
            localStorage.removeItem('participantInfo');
          }

          // Guardar nueva info
          localStorage.setItem('participantInfo', `${currentResearchId}|${currentParticipantId}`);
        } catch (error) {
          console.error('Error al limpiar datos de participante anterior:', error);
        }
      },

      setIsFlowLoading: (loading) => {
        set({ isFlowLoading: loading });
      },

      // Calcular progreso
      calculateProgress: () => {
        const { expandedSteps, responsesData } = get();
        const relevantSteps = expandedSteps.filter(step =>
          step.type !== 'welcome' && step.type !== 'thankyou' && step.type !== 'final'
        );
        const answeredStepIndices = (responsesData.modules.all_steps || [])
          .map(r => expandedSteps.findIndex(s => s.id === r.id))
          .filter(index => index !== -1);

        const completedRelevantSteps = new Set(
          answeredStepIndices.filter(index => relevantSteps.some(s => expandedSteps[index].id === s.id))
        ).size;

        set({
          totalRelevantSteps: relevantSteps.length,
          completedRelevantSteps: completedRelevantSteps
        });
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

      // Guardar respuesta de un paso
      saveStepResponse: (stepIndex, answer) => set((state) => {
        const { expandedSteps, responsesData } = state;
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return state;

        const step = expandedSteps[stepIndex];
        const newResponse: ModuleResponse = {
          id: step.id,
          stepTitle: step.name,
          stepType: step.type,
          response: sanitizeForJSON(answer),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const existingResponseIndex = responsesData.modules.all_steps.findIndex(r => r.id === step.id);
        const newAllSteps = [...responsesData.modules.all_steps];

        if (existingResponseIndex > -1) {
          newAllSteps[existingResponseIndex] = newResponse;
        } else {
          newAllSteps.push(newResponse);
        }

        const newResponsesData = {
          ...responsesData,
          modules: {
            ...responsesData.modules,
            all_steps: newAllSteps,
          }
        };

        // Forzar cálculo de progreso después de guardar
        get().calculateProgress();

        return { responsesData: newResponsesData };
      }),

      // Obtener índices de pasos respondidos
      getAnsweredStepIndices: () => {
        const { expandedSteps, responsesData } = get();
        const resultado = (responsesData.modules.all_steps || [])
          .map(r => expandedSteps.findIndex(s => s.id === r.id))
          .filter(index => index !== -1);

        return resultado;
      },

      // Obtener respuesta de un paso por ÍNDICE
      getStepResponse: (stepIndex) => {
        const { expandedSteps, responsesData } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return null;

        const step = expandedSteps[stepIndex];
        const { name: stepName } = step;

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[getStepResponse] responsesData.modules.all_steps no es un array válido.");
            return null;
        }

        const response = allApiResponses.find(resp => resp.stepTitle === stepName);
        return response ? response.response : null;
      },

      // Obtener respuesta de un paso por ID
      getStepResponseById: (stepId) => {
        const { responsesData } = get();
        if (!responsesData || !responsesData.modules || !Array.isArray(responsesData.modules.all_steps)) {
          console.warn("[getStepResponseById] La estructura de respuestas no es válida o está vacía.");
          return null;
        }
        const response = responsesData.modules.all_steps.find(r => r.id === stepId);
        return response ? response.response : null;
      },

      // Verificar si un paso ha sido respondido
      hasStepBeenAnswered: (stepIndex) => {
        const { expandedSteps, responsesData } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;

        const step = expandedSteps[stepIndex];
        const { type: stepType, name: stepName } = step;

        if (stepType === 'welcome' || stepType === 'thankyou') return true;

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[hasStepBeenAnswered] responsesData.modules.all_steps no es un array válido.");
            return false;
        }

        return allApiResponses.some(resp => resp.stepTitle === stepName);
      },

      // Obtener JSON de respuestas - ONLY use API data, ignore localStorage
      getResponsesJson: () => {
        const { responsesData } = get();
        return JSON.stringify({
          ...responsesData,
          modules: { // Solo enviar datos de la API
            demographic: responsesData.modules.demographic,
            feedback: responsesData.modules.feedback,
            welcome: responsesData.modules.welcome,
            eye_tracking: responsesData.modules.eye_tracking,
            cognitive_task: responsesData.modules.cognitive_task,
            smartvoc: responsesData.modules.smartvoc,
            all_steps: responsesData.modules.all_steps
          }
        }, null, 2);
      },

      // Limpiar todas las respuestas
      clearAllResponses: () => {
        set({ responsesData: { ...initialResponsesData } });
      },

      // Resetear la tienda completa
      resetStore: () => {
        console.log('[participantStore] resetStore llamado');
        set({
          researchId: null,
          token: null,
          participantId: null,
          error: null,
          isFlowLoading: true,
          currentStep: ParticipantFlowStep.LOADING_SESSION,
          expandedSteps: [],
          currentStepIndex: 0,
          maxVisitedIndex: 0,
          responsesData: { ...initialResponsesData },
          completedRelevantSteps: 0,
          totalRelevantSteps: 0
        });
        localStorage.removeItem('participantToken');
        localStorage.removeItem('participantInfo');
      }
    }),
    {
      name: 'participantResponses',
      storage: createJSONStorage(() => localStorage),
      // Custom merge function to handle hydration
      merge: (persistedState, currentState) => {
        const state = persistedState as ParticipantState;

        console.log('[participantStore] merge llamado - estado persistido:', {
          hasToken: !!state.token,
          hasParticipantId: !!state.participantId,
          hasResearchId: !!state.researchId
        });

        // Sincronizar token desde localStorage si no está en el store
        if (!state.token) {
          const localStorageToken = localStorage.getItem('participantToken');
          if (localStorageToken) {
            console.log('[participantStore] Sincronizando token desde localStorage');
            state.token = localStorageToken;
          }
        }

        // Sincronizar participantId desde localStorage si no está en el store
        if (!state.participantId) {
            const localStorageParticipantId = localStorage.getItem('participantId');
            if (localStorageParticipantId) {
                console.log('[participantStore] Sincronizando participantId desde localStorage');
                state.participantId = localStorageParticipantId;
            }
        }

        // No sobreescribir el estado de carga o los pasos expandidos durante la hidratación
        if (currentState.isFlowLoading || currentState.expandedSteps.length > 0) {
          return {
            ...currentState,
            ...state,
            isFlowLoading: currentState.isFlowLoading,
            expandedSteps: currentState.expandedSteps,
          };
        }
        return { ...currentState, ...state };
      }
    }
  )
);
