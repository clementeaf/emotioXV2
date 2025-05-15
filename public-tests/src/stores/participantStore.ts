import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ParticipantFlowStep } from '../types/flow';

export interface ModuleResponse {
  id: string;
  createdAt: string;
  updatedAt: string;
  stepTitle: string;
  stepType: string;
  response: any;
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
  config?: any;
}

interface ParticipantInfo {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
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
  
  // Métodos de flujo
  handleLoginSuccess: (participant: ParticipantInfo) => void;
  goToNextStep: (answer?: any) => void;
  navigateToStep: (targetIndex: number) => void;
  
  // Métodos de respuestas
  saveStepResponse: (stepIndex: number, answer: any) => void;
  getStepResponse: (stepIndex: number) => any;
  hasStepBeenAnswered: (stepIndex: number) => boolean;
  getAnsweredStepIndices: () => number[];
  getResponsesJson: () => string;
  
  // <<< NUEVA ACCIÓN >>>
  setLoadedResponses: (loadedStepResponses: ModuleResponse[]) => void;
  
  // Persistencia forzada
  forceSaveToLocalStorage: () => void;
  
  // Reset y utilidades
  resetStore: () => void;
  calculateProgress: () => void;
}

// Función auxiliar para sanear objetos antes de JSON.stringify
const sanitizeForJSON = (obj: any): any => {
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

// Función para guardar manualmente en localStorage
const saveToLocalStorage = (key: string, data: any): void => {
  try {
    const serializedData = JSON.stringify(sanitizeForJSON(data));
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`[ParticipantStore] Error guardando en localStorage (${key}):`, error);
  }
};

// Función para cargar manualmente desde localStorage
const loadFromLocalStorage = (key: string): any => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return null;
    }
    const data = JSON.parse(serializedData);
    return data;
  } catch (error) {
    console.error(`[ParticipantStore] Error cargando desde localStorage (${key}):`, error);
    return null;
  }
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
      // Estado inicial
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
      
      // Acciones básicas
      setResearchId: (id) => set({ researchId: id }),
      setToken: (token) => set({ token }),
      setParticipant: (participant) => {
        set({ 
          participantId: participant.id,
          responsesData: {
            ...get().responsesData,
            participantId: participant.id
          }
        });
        
        // Guardar forzado en localStorage
        const state = get();
        saveToLocalStorage('participantInfo', {
          id: participant.id,
          researchId: state.researchId
        });
        get().forceSaveToLocalStorage();
      },
      setError: (error) => set({ error }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setCurrentStepIndex: (index) => set((state) => ({ 
        currentStepIndex: index,
        maxVisitedIndex: Math.max(state.maxVisitedIndex, index) 
      })),
      setExpandedSteps: (steps) => {
        set({ expandedSteps: steps });
        
        // Forzar persistencia de pasos
        saveToLocalStorage('expandedSteps', steps);
      },
      
      // Forzar guardado en localStorage
      forceSaveToLocalStorage: () => {
        const state = get();
        saveToLocalStorage('participantResponses', state.responsesData);
        saveToLocalStorage('participantState', {
          currentStepIndex: state.currentStepIndex,
          maxVisitedIndex: state.maxVisitedIndex,
          researchId: state.researchId,
          participantId: state.participantId,
          token: state.token
        });
      },
      
      // <<< NUEVA ACCIÓN >>>
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
        
        // Guardar token en localStorage
        const storedToken = localStorage.getItem('participantToken');
        if (storedToken) {
          const updatedResponsesData = {
            ...get().responsesData,
            participantId: participant.id,
            researchId: researchId || get().responsesData.researchId,
          };
          
          set({
            token: storedToken,
            participantId: participant.id,
            error: null,
            isFlowLoading: true,
            currentStep: ParticipantFlowStep.LOADING_SESSION,
            responsesData: updatedResponsesData
          });
          
          // Guardar en localStorage
          saveToLocalStorage('participantResponses', updatedResponsesData);
          saveToLocalStorage('participantInfo', {
            id: participant.id,
            researchId: researchId
          });
          
          // Aquí se debería llamar a la función para construir los pasos expandidos
          // Esto se implementará en el React Component que use este store
        } else {
          set({
            error: "Error interno post-login: Falta token o ID.",
            currentStep: ParticipantFlowStep.ERROR,
            isFlowLoading: false
          });
        }
      },
      
      // Método para guardar una respuesta
      saveStepResponse: (stepIndex, answer) => {
        const { expandedSteps } = get();
        
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return;
        
        const stepInfo = expandedSteps[stepIndex];
        const { id: stepId, type: stepType, name: stepName, config } = stepInfo;
        
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
          id: stepId,
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
              resp => resp.id === stepId
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
              resp => resp.id === stepId
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
              resp => resp.id === stepId
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
            resp => resp.id === stepId
          );
          
          if (allStepsIndex >= 0) {
            updatedData.modules.all_steps[allStepsIndex] = moduleResponse;
          } else {
            updatedData.modules.all_steps.push(moduleResponse);
          }
          
          // Guardar en localStorage de forma independiente
          saveToLocalStorage('participantResponses', updatedData);
          saveToLocalStorage(`response_${stepId}`, moduleResponse);
          
          return { responsesData: updatedData };
        });
        
        // Actualizar expandedSteps para mantener las respuestas en la configuración
        set(state => {
          const newSteps = [...state.expandedSteps];
          const targetStep = newSteps[stepIndex];
          
          if (targetStep) {
            targetStep.config = {
              ...targetStep.config,
              savedResponses: answer
            };
            
            // Guardar pasos actualizados
            saveToLocalStorage('expandedSteps', newSteps);
          }
          
          return { expandedSteps: newSteps };
        });
        
        // Recalcular progreso
        get().calculateProgress();
        
        // Forzar guardado completo
        get().forceSaveToLocalStorage();
      },
      
      // Avanzar al siguiente paso
      goToNextStep: (answer?: any) => {
        const { 
          currentStepIndex, 
          expandedSteps, 
          isFlowLoading, 
          maxVisitedIndex, 
          researchId 
        } = get();
        
        if (isFlowLoading || currentStepIndex >= expandedSteps.length - 1) {
          // Si estamos en el último paso
          if (!isFlowLoading && currentStepIndex === expandedSteps.length - 1) {
            // Si hay respuesta, guardarla
            if (answer !== undefined) {
              get().saveStepResponse(currentStepIndex, answer);
            }
            
            // Finalizar flujo
            set(state => ({
              currentStep: ParticipantFlowStep.DONE,
              responsesData: {
                ...state.responsesData,
                endTime: Date.now()
              }
            }));
            
            const finalData = {
              ...get().responsesData,
              endTime: Date.now()
            };
            saveToLocalStorage('participantResponses', finalData);
            saveToLocalStorage('flowComplete', { timestamp: Date.now() });
            
            // Forzar guardado completo
            get().forceSaveToLocalStorage();
          }
          return;
        }
        
        // Guardar respuesta del paso actual
        if (answer !== undefined) {
          get().saveStepResponse(currentStepIndex, answer);
        }
        
        // Avanzar al siguiente paso
        const nextIndex = currentStepIndex + 1;
        
        // Actualizar máximo índice visitado
        if (nextIndex > maxVisitedIndex) {
          set({ maxVisitedIndex: nextIndex });
          
          // Guardar en localStorage
          saveToLocalStorage(`maxVisitedIndex_${researchId}`, nextIndex);
        }
        
        // Actualizar índice actual
        set({ currentStepIndex: nextIndex, error: null });
        
        // Recalcular progreso
        get().calculateProgress();
        
        // Forzar guardado completo
        get().forceSaveToLocalStorage();
      },
      
      // Navegar a un paso específico
      navigateToStep: (targetIndex) => {
        const { 
          currentStepIndex, 
          expandedSteps, 
          isFlowLoading, 
          maxVisitedIndex 
        } = get();
        
        // Obtener pasos respondidos
        const answeredSteps = get().getAnsweredStepIndices();
        const isAnsweredStep = answeredSteps.includes(targetIndex);
        
        // Validar navegación
        if (isFlowLoading || 
            targetIndex < 0 || 
            targetIndex >= expandedSteps.length || 
            (targetIndex > maxVisitedIndex && !isAnsweredStep)) {
          
          if (targetIndex === currentStepIndex) {
          } else {
            console.warn(`[ParticipantStore] Navegación bloqueada al índice ${targetIndex}.`);
          }
          return;
        }

        const savedResponse = get().getStepResponse(targetIndex);
        
        // Actualizar config con la respuesta guardada
        if (savedResponse !== null && savedResponse !== undefined) {
          set(state => {
            const newSteps = [...state.expandedSteps];
            const targetStep = newSteps[targetIndex];
            
            if (targetStep && targetStep.config?.savedResponses !== savedResponse) {
              targetStep.config = {
                ...targetStep.config,
                savedResponses: savedResponse
              };
              return { expandedSteps: newSteps };
            }
            
            return state; // No cambios
          });
        }
        
        // Actualizar índice actual
        set({ currentStepIndex: targetIndex, error: null });
        
        // Recalcular progreso
        get().calculateProgress();
        
        // Forzar guardado completo
        get().forceSaveToLocalStorage();
      },
      
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
          const { id: stepId, type: stepType, name: stepName } = step; 
          
          if (stepType === 'welcome' || stepType === 'thankyou') {
            completedStepIndices.add(index);
            return;
          }
          
          // <<< MODIFICADO: Buscar en allApiResponses usando stepName/stepTitle >>>
          if (allApiResponses.some(resp => resp.stepTitle === stepName)) {
            completedStepIndices.add(index);
          }
        });
        
        // Marcar todos los pasos hasta maxVisitedIndex como completados/visitados
        for (let i = 0; i <= maxVisitedIndex; i++) {
          completedStepIndices.add(i);
        }
        
        return Array.from(completedStepIndices).sort((a, b) => a - b);
      },
      
      // Obtener respuesta de un paso
      getStepResponse: (stepIndex) => {
        const { expandedSteps, responsesData } = get();
        
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return null;
        
        const step = expandedSteps[stepIndex];
        // <<< Usar step.name para comparar con apiResponse.stepTitle >>>
        const { id: stepId, type: stepType, name: stepName } = step;
        
        if (stepType === 'welcome' || stepType === 'thankyou') return null;
        
        // Intentar cargar directamente de localStorage primero (si aún se usa)
        // const directResponse = loadFromLocalStorage(`response_${stepId}`);
        // if (directResponse && directResponse.response) {
        //   return directResponse.response;
        // }
        
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
        const { id: stepId, type: stepType, name: stepName } = step;
        
        if (stepType === 'welcome' || stepType === 'thankyou') return true;
        
        // Verificar directamente en localStorage (si aún se usa)
        // const directResponse = loadFromLocalStorage(`response_${stepId}`);
        // if (directResponse) {
        //   return true;
        // }
        
        const allApiResponses = responsesData.modules.all_steps || [];
        if (!Array.isArray(allApiResponses)) {
            console.warn("[hasStepBeenAnswered] responsesData.modules.all_steps no es un array válido.");
            return false;
        }

        // <<< MODIFICADO: Buscar en allApiResponses usando stepName/stepTitle >>>
        return allApiResponses.some(resp => resp.stepTitle === stepName);
      },
      
      // Obtener JSON de respuestas
      getResponsesJson: () => {
        // Asegurar que tenemos la versión más actualizada antes de devolver
        const storedResponses = loadFromLocalStorage('participantResponses');
        const current = get().responsesData;
        
        // Combinar lo almacenado con el estado actual
        const mergedResponses = storedResponses 
          ? { ...current, ...storedResponses, modules: { ...current.modules, ...storedResponses.modules } }
          : current;
        
        return JSON.stringify(mergedResponses, null, 2);
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
        saveToLocalStorage('progress', { completedRelevantSteps, totalRelevantSteps });
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
          responsesData: state.responsesData
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
              const storedResponses = loadFromLocalStorage('participantResponses');
              if (storedResponses && Object.keys(storedResponses).length > 0) {
                
                if (restoredState.responsesData && storedResponses) {
                  restoredState.responsesData = {
                    ...restoredState.responsesData,
                    ...storedResponses,
                    modules: {
                      ...restoredState.responsesData.modules,
                      ...storedResponses.modules
                    }
                  };
                }
              }
            } catch (e) {
              console.error('[ParticipantStore] Error cargando datos adicionales:', e);
            }
          }
        };
      }
    }
  )
); 