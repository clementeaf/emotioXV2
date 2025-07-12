import { QuestionDictionary, buildQuestionDictionary } from '@emotiox/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ApiClient } from '../lib/api';
import { ParticipantFlowStep } from '../types/flow';

export interface ModuleResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  stepTitle: string;
  stepType: string;
  questionKey?: string; // NUEVO: questionKey del diccionario global
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
  timestamps?: {
    start?: number;
    end?: number;
    duration?: number;
  };
  sectionTimings?: Array<{
    sectionId: string;
    start: number;
    end?: number;
    duration?: number;
  }>;
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
  deviceType: 'mobile' | 'tablet' | 'desktop' | null;
  setDeviceType: (type: 'mobile' | 'tablet' | 'desktop') => void;
  reentryCount: number;
  incrementReentryCount: () => void;
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

  // NUEVO: Diccionario global de preguntas
  questionDictionary: QuestionDictionary;
  buildQuestionDictionary: () => void;
  getQuestionKey: (stepId: string) => string | null;
  getQuestionByKey: (questionKey: string) => any | null;

  // Limpieza de datos
  cleanupPreviousParticipantData: (currentResearchId: string, currentParticipantId: string) => void;

  // Reset y utilidades
  clearAllResponses: () => void;
  resetStore: () => void;
  calculateProgress: () => void;

  // NUEVO: métodos para timer global y por sección
  startGlobalTimer: () => void;
  stopGlobalTimer: () => void;
  startSectionTimer: (sectionId: string) => void;
  stopSectionTimer: (sectionId: string) => void;

  // NUEVO: Método para guardar respuesta usando API client con questionKey
  saveStepResponseToAPI: (stepIndex: number, answer: unknown) => Promise<boolean>;
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
      deviceType: null,
      setDeviceType: (type) => set({ deviceType: type }),
      reentryCount: typeof window !== 'undefined' && localStorage.getItem('reentryCount') ? parseInt(localStorage.getItem('reentryCount') || '0', 10) : 0,
      incrementReentryCount: () => {
        set((state) => {
          const newCount = state.reentryCount + 1;
          if (typeof window !== 'undefined') {
            localStorage.setItem('reentryCount', newCount.toString());
          }
          return { reentryCount: newCount };
        });
      },

      setResearchId: (id) => set({ researchId: id }),
      setToken: (token) => {
        set({ token });
        if (token) {
          localStorage.setItem('participantToken', token);
        } else {
          localStorage.removeItem('participantToken');
        }
      },
      setParticipant: (participant) => {
        set({
          participantId: participant.id,
          error: null
        });
      },
      setError: (error) => set({ error }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentStepIndex: (index) => {
        set((state) => {
          if (state.currentStepIndex === index) {
            console.warn(`[participantStore] ⚠️ El índice ya es ${index}. No se realiza ninguna acción.`);
            return state;
          }
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
        // NUEVO: Construir automáticamente el diccionario global cuando se actualicen los pasos
        if (steps.length > 0) {
          const questionDictionary = buildQuestionDictionary(steps);

          // NUEVO: Validaciones y logs de duplicados/inconsistencias
          validateQuestionDictionary(questionDictionary, steps);

          set({ questionDictionary });
        }
      },

      // Set loaded responses from API and clean conflicting localStorage
      setLoadedResponses: (loadedStepResponses) => set((state) => {
        const newResponsesData = JSON.parse(JSON.stringify(state.responsesData));
        newResponsesData.participantId = state.participantId || newResponsesData.participantId;

        if (Array.isArray(loadedStepResponses)) {
          // 🔥 FIX: Reemplazar completamente all_steps con el array de la API
          // NO hacer merge, NO filtrar por id único
          newResponsesData.modules = {
            ...newResponsesData.modules,
            all_steps: loadedStepResponses,
          };
        } else {
           console.warn("[ParticipantStore] setLoadedResponses esperaba un array pero recibió:", loadedStepResponses);
        }

        return { responsesData: newResponsesData };
      }),

      // Método para manejar el éxito del login
      handleLoginSuccess: (participant) => {
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

        get().cleanupPreviousParticipantData(researchId, participant.id);

        const storedToken = localStorage.getItem('participantToken');

        if (storedToken) {
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

        if (targetIndex === state.currentStepIndex) {
          return state;
        }

        const { expandedSteps, maxVisitedIndex, isFlowLoading } = state;

        if (expandedSteps.length === 0) {
          return state;
        }

        const validaciones = {
          isFlowLoading,
          targetIndexOutOfRange: targetIndex < 0 || targetIndex >= expandedSteps.length,
          targetStep: expandedSteps[targetIndex],
          maxVisitedIndex
        };

        const isAnsweredStep = state.hasStepBeenAnswered(targetIndex);
        const condicionBloqueo = targetIndex > maxVisitedIndex && !isAnsweredStep;

        if (isFlowLoading ||
            targetIndex < 0 ||
            targetIndex >= expandedSteps.length ||
            (targetIndex > maxVisitedIndex && !isAnsweredStep)) {

          // No-op si el índice es el actual
          if (targetIndex !== state.currentStepIndex) {
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

        if (savedResponse !== null && savedResponse !== undefined) {
          const newExpandedSteps = expandedSteps.map((step, index) =>
            index === targetIndex ? {
              ...step,
              config: {
                ...(typeof step.config === 'object' && step.config !== null ? step.config : {}),
                savedResponses: savedResponse
              }
            } : step
          );

          return {
            currentStepIndex: targetIndex,
            error: null,
            expandedSteps: newExpandedSteps
          };
        }

        return { currentStepIndex: targetIndex, error: null };
      }),

      // Guardar respuesta de un paso
      saveStepResponse: (stepIndex, answer) => set((state) => {
        const { expandedSteps, responsesData } = state;
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return state;

        const step = expandedSteps[stepIndex];
        const questionKey = get().getQuestionKey(step.id);

        if (!questionKey) {
          console.warn(`[saveStepResponse] ⚠️ No se encontró questionKey para stepId: ${step.id} - usando stepType/stepTitle`);
        }

        const newResponse: ModuleResponse = {
          id: step.id,
          stepTitle: step.name,
          stepType: step.type,
          questionKey: questionKey || undefined, // Corregir tipo: null -> undefined
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

        get().calculateProgress();

        return { responsesData: newResponsesData };
      }),

      // NUEVO: Método para guardar respuesta usando API client con questionKey
      saveStepResponseToAPI: async (stepIndex: number, answer: unknown) => {
        const { expandedSteps, researchId, participantId } = get();
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;

        const step = expandedSteps[stepIndex];
        const questionKey = get().getQuestionKey(step.id);

        if (!researchId || !participantId) {
          console.error('[saveStepResponseToAPI] ❌ Faltan researchId o participantId');
          return false;
        }

        try {
          const apiClient = new ApiClient();
          const result = await apiClient.saveModuleResponse({
            researchId,
            participantId,
            stepType: step.type,
            stepTitle: step.name,
            questionKey: questionKey || undefined, // Corregir tipo: null -> undefined
            response: answer
          });

          if (result.error) {
            console.error('[saveStepResponseToAPI] ❌ Error guardando respuesta:', result.message);
            return false;
          }
          return true;
        } catch (error) {
          console.error('[saveStepResponseToAPI] 💥 Exception:', error);
          return false;
        }
      },

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

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) {
          console.warn('[getStepResponse] ❌ Índice fuera de rango:', { stepIndex, expandedStepsLength: expandedSteps.length });
          return null;
        }

        const step = expandedSteps[stepIndex];
        const questionKey = get().getQuestionKey(step.id);

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[getStepResponse] responsesData.modules.all_steps no es un array válido.");
            return null;
        }

        // NUEVO: Buscar por questionKey primero (método preferido)
        if (questionKey) {
          const response = allApiResponses.find(resp => resp.questionKey === questionKey);
          if (response) {
            return response.response; // DEVOLVER SOLO EL VALOR DE LA RESPUESTA
          }
        }

        // FALLBACK: Buscar por stepType + stepTitle (método anterior)
        const response = allApiResponses.find(resp =>
          resp.stepType === step.type && resp.stepTitle === step.name
        );

        if (response) {
          return response.response; // DEVOLVER SOLO EL VALOR DE LA RESPUESTA
        }

        return null;
      },

      // Obtener respuesta de un paso por ID
      getStepResponseById: (stepId) => {
        const { responsesData } = get();

        if (!responsesData || !responsesData.modules || !Array.isArray(responsesData.modules.all_steps)) {
          console.warn("[getStepResponseById] La estructura de respuestas no es válida o está vacía.");
          return null;
        }

        // NUEVO: Buscar por questionKey primero (método preferido)
        const questionKey = get().getQuestionKey(stepId);
        if (questionKey) {
          const response = responsesData.modules.all_steps.find(r => r.questionKey === questionKey);
          if (response) {
            return response.response;
          }
        }
        const response = responsesData.modules.all_steps.find(r => {
          const match = r.id === stepId;
          return match;
        });

        return response ? response.response : null;
      },

      // Verificar si un paso ha sido respondido
      hasStepBeenAnswered: (stepIndex) => {
        const { expandedSteps, responsesData } = get();

        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;

        const step = expandedSteps[stepIndex];
        const { type: stepType, id: stepId } = step;

        if (stepType === 'welcome' || stepType === 'thankyou') return true;

        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[hasStepBeenAnswered] responsesData.modules.all_steps no es un array válido.");
            return false;
        }

        return allApiResponses.some(resp => resp.id === stepId);
      },

      // Obtener JSON de respuestas - ONLY use API data, ignore localStorage
      getResponsesJson: () => {
        const { responsesData } = get();
        return JSON.stringify({
          ...responsesData,
          modules: {
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

      clearAllResponses: () => {
        set({ responsesData: { ...initialResponsesData } });
      },

      resetStore: () => {
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
      },

      // NUEVO: métodos para timer global y por sección
      startGlobalTimer: () => {
        set((state) => {
          const now = Date.now();
          return {
            responsesData: {
              ...state.responsesData,
              timestamps: {
                ...state.responsesData.timestamps,
                start: now
              }
            }
          };
        });
      },
      stopGlobalTimer: () => {
        set((state) => {
          const now = Date.now();
          const start = state.responsesData.timestamps?.start || state.responsesData.startTime;
          return {
            responsesData: {
              ...state.responsesData,
              timestamps: {
                ...state.responsesData.timestamps,
                end: now,
                duration: start ? now - start : undefined
              }
            }
          };
        });
      },
      startSectionTimer: (sectionId) => {
        set((state) => {
          const now = Date.now();
          const timings = state.responsesData.sectionTimings || [];
          // Si ya existe, no reiniciar
          if (timings.some(t => t.sectionId === sectionId && t.start)) return {};
          return {
            responsesData: {
              ...state.responsesData,
              sectionTimings: [
                ...timings,
                { sectionId, start: now }
              ]
            }
          };
        });
      },
      stopSectionTimer: (sectionId) => {
        set((state) => {
          const now = Date.now();
          const timings = state.responsesData.sectionTimings || [];
          const updated = timings.map(t =>
            t.sectionId === sectionId && !t.end
              ? { ...t, end: now, duration: t.start ? now - t.start : undefined }
              : t
          );
          return {
            responsesData: {
              ...state.responsesData,
              sectionTimings: updated
            }
          };
        });
      },

      // NUEVO: Diccionario global de preguntas
      questionDictionary: {},
      buildQuestionDictionary: () => {
        const { expandedSteps } = get();
        set({ questionDictionary: buildQuestionDictionary(expandedSteps) });
      },
      getQuestionKey: (stepId: string) => {
        const { questionDictionary } = get();
        // Ahora el stepId puede ser el questionKey directamente
        return questionDictionary[stepId]?.questionKey || null;
      },
      getQuestionByKey: (questionKey: string) => {
        const { questionDictionary } = get();
        // Acceso directo por questionKey
        return questionDictionary[questionKey] || null;
      },
    }),
    {
      name: 'participantResponses',
      storage: createJSONStorage(() => localStorage),
      // Custom merge function to handle hydration
      merge: (persistedState, currentState) => {
        const state = persistedState as ParticipantState;

        if (!state.token) {
          const localStorageToken = localStorage.getItem('participantToken');
          if (localStorageToken) {
            state.token = localStorageToken;
          }
        }

        if (!state.participantId) {
            const localStorageParticipantId = localStorage.getItem('participantId');
            if (localStorageParticipantId) {
                state.participantId = localStorageParticipantId;
            }
        }

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

function validateQuestionDictionary(questionDictionary: QuestionDictionary, steps: ExpandedStep[]) {

  const questionKeys = new Set<string>();
  const stepIds = new Set<string>();
  const duplicates: { questionKey: string; stepIds: string[] }[] = [];
  const inconsistencies: { stepId: string; issue: string }[] = [];

  for (const [stepId, question] of Object.entries(questionDictionary)) {
    // Verificar duplicados de questionKey
    if (questionKeys.has(question.questionKey)) {
      const existingEntry = duplicates.find(d => d.questionKey === question.questionKey);
      if (existingEntry) {
        existingEntry.stepIds.push(stepId);
      } else {
        const existingStepId = Object.keys(questionDictionary).find(id =>
          id !== stepId && questionDictionary[id].questionKey === question.questionKey
        );
        duplicates.push({
          questionKey: question.questionKey,
          stepIds: [existingStepId!, stepId]
        });
      }
    } else {
      questionKeys.add(question.questionKey);
    }

    // Verificar duplicados de stepId
    if (stepIds.has(stepId)) {
      inconsistencies.push({
        stepId,
        issue: 'stepId duplicado en el diccionario'
      });
    } else {
      stepIds.add(stepId);
    }

    // Verificar inconsistencias de datos solo para entradas críticas
    if (!stepId.includes('unknown_') && !stepId.includes('temp_') && !stepId.includes('debug_')) {
      if (!question.title || question.title.trim() === '') {
        inconsistencies.push({
          stepId,
          issue: 'Título vacío o faltante'
        });
      }

      if (!question.type || question.type.trim() === '') {
        inconsistencies.push({
          stepId,
          issue: 'Tipo de pregunta vacío o faltante'
        });
      }

      if (!question.module || question.module.trim() === '') {
        inconsistencies.push({
          stepId,
          issue: 'Módulo vacío o faltante'
        });
      }
    }
  }

  // Verificar que todos los steps estén en el diccionario
  const stepsInDictionary = new Set(Object.keys(questionDictionary));
  const missingSteps = steps.filter(step => !stepsInDictionary.has(step.id));

  // Ignorar duplicados intencionales de alias core
  const isCoreAlias = (key: string, stepIds: string[]) => {
    const coreGroups = [
      ['demographic_demographic', 'demographic', 'demographics'],
      ['welcome_welcome', 'welcome', 'welcome_screen'],
      ['thankyou_thankyou', 'thankyou', 'thank_you_screen']
    ];
    return coreGroups.some(group => group.every(k => stepIds.includes(k)) && group.includes(key));
  };

  // NUEVO: Filtrar steps faltantes que son esperados (no críticos)
  const criticalMissingSteps = missingSteps.filter(step => {
    // Ignorar steps que son opcionales o que pueden no estar presentes
    const optionalSteps = ['demographic', 'demographics'];
    return !optionalSteps.includes(step.id);
  });

  // Reportar resultados solo si hay problemas críticos
  if (duplicates.length > 0) {
    duplicates.forEach(dup => {
      if (!isCoreAlias(dup.questionKey, dup.stepIds)) {
        console.warn(`[validateQuestionDictionary] ⚠️ DUPLICADO: questionKey "${dup.questionKey}" usado por stepIds: ${dup.stepIds.join(', ')}`);
      }
    });
  }

  if (inconsistencies.length > 0) {
    console.warn(`[validateQuestionDictionary] ⚠️ INCONSISTENCIAS ENCONTRADAS:`, inconsistencies);
    inconsistencies.forEach(inc => {
      console.warn(`  - stepId "${inc.stepId}": ${inc.issue}`);
    });
  }

  if (criticalMissingSteps.length > 0) {
    console.warn(`[validateQuestionDictionary] ⚠️ STEPS CRÍTICOS FALTANTES EN DICCIONARIO:`, criticalMissingSteps.map(s => s.id));
  }

  // Log informativo para steps opcionales faltantes (solo en desarrollo)
  if (missingSteps.length > 0 && criticalMissingSteps.length !== missingSteps.length) {
    const optionalMissingSteps = missingSteps.filter(step => !criticalMissingSteps.includes(step));
  }
}
