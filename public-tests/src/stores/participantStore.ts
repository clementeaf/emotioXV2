import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ParticipantFlowStep } from '../types/flow';
import { Participant } from '../../../shared/interfaces/participant';

// Interfaz para las respuestas de módulos
export interface ModuleResponse {
  stepId: string;
  stepType: string;
  stepName?: string;
  question?: string;
  answer?: any;
  timestamp: number;
}

// Interfaz para el JSON completo de respuestas
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

// Interfaz para un paso expandido
export interface ExpandedStep {
  id: string;
  name: string;
  type: string;
  config?: any;
}

// Interfaz para el participante (adaptada de la interfaz compartida)
interface ParticipantInfo {
  id: string;
  name?: string;
  email?: string;
  [key: string]: any;
}

// Interfaz para el estado de la tienda del participante
interface ParticipantState {
  // Estado general
  researchId: string | null;
  token: string | null;
  participantId: string | null;
  error: string | null;
  isFlowLoading: boolean;
  
  // Flujo y pasos
  currentStep: ParticipantFlowStep;
  expandedSteps: ExpandedStep[];
  currentStepIndex: number;
  maxVisitedIndex: number;
  completedRelevantSteps: number; // Para la barra de progreso
  totalRelevantSteps: number;     // Para la barra de progreso
  
  // Datos de respuestas
  responsesData: ResponsesData;
  
  // Acciones
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
    console.log(`[ParticipantStore] Datos guardados en localStorage (${key}): ${serializedData.length} caracteres`);
  } catch (error) {
    console.error(`[ParticipantStore] Error guardando en localStorage (${key}):`, error);
  }
};

// Función para cargar manualmente desde localStorage
const loadFromLocalStorage = (key: string): any => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      console.log(`[ParticipantStore] No hay datos en localStorage para la clave (${key})`);
      return null;
    }
    const data = JSON.parse(serializedData);
    console.log(`[ParticipantStore] Datos cargados desde localStorage (${key}): ${serializedData.length} caracteres`);
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
      setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
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
        const { expandedSteps, responsesData } = get();
        
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return;
        
        const stepInfo = expandedSteps[stepIndex];
        const { id: stepId, type: stepType, name: stepName, config } = stepInfo;
        
        // Ignorar welcome/thankyou si no tienen respuesta
        if ((stepType === 'welcome' || stepType === 'thankyou') && answer === undefined) {
          console.log(`[ParticipantStore] Paso ${stepType} sin respuesta, excluido del JSON.`);
          return;
        }
        
        // Forzar valores para cognitive, smartvoc y eye-tracking
        const isCognitive = stepType.startsWith('cognitive_');
        const isSmartVOC = stepType.startsWith('smartvoc_');
        const isEyeTracking = stepType.startsWith('eye_tracking_');
        
        if (answer === undefined && (isCognitive || isSmartVOC || isEyeTracking)) {
          console.log(`[ParticipantStore] ALERTA: Respuesta undefined para ${stepType}, usando objeto vacío`);
          answer = isCognitive ? { text: "" } : isSmartVOC ? { value: 0 } : isEyeTracking ? { data: [] } : { value: null };
        }
        
        // Crear objeto de respuesta
        const moduleResponse: ModuleResponse = {
          stepId,
          stepType,
          stepName,
          question: config?.questionText || config?.title || stepName,
          answer: sanitizeForJSON(answer),
          timestamp: Date.now()
        };
        
        // Verificar sanitización
        if (moduleResponse.answer === undefined || moduleResponse.answer === null) {
          console.warn('[ParticipantStore] ALERTA: Respuesta perdida después de sanitizar');
          moduleResponse.answer = isCognitive 
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
              resp => resp.stepId === stepId
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
              resp => resp.stepId === stepId
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
              resp => resp.stepId === stepId
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
            resp => resp.stepId === stepId
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
            
            // Guardar estado final en localStorage
            console.log('[ParticipantStore] Flujo completado. Guardando JSON final...');
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
            console.log("[ParticipantStore] Clic en el paso actual, no se navega.");
          } else {
            console.warn(`[ParticipantStore] Navegación bloqueada al índice ${targetIndex}.`);
          }
          return;
        }
        
        // Navegación válida
        console.log(`[ParticipantStore] Navegando al paso ${targetIndex} (${expandedSteps[targetIndex]?.id}).`);
        
        // Recuperar respuesta guardada
        const savedResponse = get().getStepResponse(targetIndex);
        
        // Actualizar config con la respuesta guardada
        if (savedResponse !== null && savedResponse !== undefined) {
          set(state => {
            const newSteps = [...state.expandedSteps];
            const targetStep = newSteps[targetIndex];
            
            if (targetStep && targetStep.config?.savedResponses !== savedResponse) {
              console.log(`[ParticipantStore] Cargando respuesta guardada para ${targetStep.type}`);
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
      
      // Obtener respuesta de un paso
      getStepResponse: (stepIndex) => {
        const { expandedSteps, responsesData } = get();
        
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return null;
        
        const step = expandedSteps[stepIndex];
        const { id: stepId, type: stepType } = step;
        
        if (stepType === 'welcome' || stepType === 'thankyou') return null;
        
        // Primero, intentar cargar directamente de localStorage para ese paso específico
        const directResponse = loadFromLocalStorage(`response_${stepId}`);
        if (directResponse && directResponse.answer) {
          return directResponse.answer;
        }
        
        // Buscar en all_steps primero
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
          const response = responsesData.modules.all_steps.find(resp => resp.stepId === stepId);
          if (response) return response.answer;
        }
        
        // Buscar en categorías específicas
        if (stepType === 'demographic' && responsesData.modules.demographic) {
          return responsesData.modules.demographic.stepId === stepId ? 
            responsesData.modules.demographic.answer : null;
        } 
        else if (step.name?.includes('Que te ha parecido el módulo') && responsesData.modules.feedback) {
          return responsesData.modules.feedback.stepId === stepId ? 
            responsesData.modules.feedback.answer : null;
        }
        else if (stepType.startsWith('cognitive_') && Array.isArray(responsesData.modules.cognitive_task)) {
          const response = responsesData.modules.cognitive_task.find(resp => resp.stepId === stepId);
          return response ? response.answer : null;
        }
        else if (stepType.startsWith('smartvoc_') && Array.isArray(responsesData.modules.smartvoc)) {
          const response = responsesData.modules.smartvoc.find(resp => resp.stepId === stepId);
          return response ? response.answer : null;
        }
        else if (stepType.startsWith('eye_tracking_') && Array.isArray(responsesData.modules.eye_tracking)) {
          const response = responsesData.modules.eye_tracking.find(resp => resp.stepId === stepId);
          return response ? response.answer : null;
        }
        else {
          // Buscar en categoría dinámica
          const moduleCategory = stepType.split('_')[0] || 'other';
          const moduleResponses = responsesData.modules[moduleCategory];
          
          if (Array.isArray(moduleResponses)) {
            const response = moduleResponses.find(resp => resp.stepId === stepId);
            return response ? response.answer : null;
          }
        }
        
        return null;
      },
      
      // Verificar si un paso ha sido respondido
      hasStepBeenAnswered: (stepIndex) => {
        const { expandedSteps, responsesData } = get();
        
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;
        
        const step = expandedSteps[stepIndex];
        const { id: stepId, type: stepType } = step;
        
        if (stepType === 'welcome' || stepType === 'thankyou') return true;
        
        // Primero, verificar directamente en localStorage
        const directResponse = loadFromLocalStorage(`response_${stepId}`);
        if (directResponse) {
          return true;
        }
        
        // Buscar en all_steps primero
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
          if (responsesData.modules.all_steps.some(resp => resp.stepId === stepId)) {
            return true;
          }
        }
        
        // Buscar en categorías específicas
        if (stepType === 'demographic' && responsesData.modules.demographic) {
          return responsesData.modules.demographic.stepId === stepId;
        } 
        else if (step.name?.includes('Que te ha parecido el módulo') && responsesData.modules.feedback) {
          return responsesData.modules.feedback.stepId === stepId;
        }
        else if (stepType.startsWith('cognitive_') && Array.isArray(responsesData.modules.cognitive_task)) {
          return responsesData.modules.cognitive_task.some(resp => resp.stepId === stepId);
        }
        else if (stepType.startsWith('smartvoc_') && Array.isArray(responsesData.modules.smartvoc)) {
          return responsesData.modules.smartvoc.some(resp => resp.stepId === stepId);
        }
        else if (stepType.startsWith('eye_tracking_') && Array.isArray(responsesData.modules.eye_tracking)) {
          return responsesData.modules.eye_tracking.some(resp => resp.stepId === stepId);
        }
        else {
          // Buscar en categoría dinámica
          const moduleCategory = stepType.split('_')[0] || 'other';
          const moduleResponses = responsesData.modules[moduleCategory];
          
          if (Array.isArray(moduleResponses)) {
            return moduleResponses.some(resp => resp.stepId === stepId);
          }
        }
        
        return false;
      },
      
      // Obtener índices de pasos respondidos
      getAnsweredStepIndices: () => {
        const { expandedSteps, responsesData, maxVisitedIndex } = get();
        const completedStepIndices = new Set<number>();
        
        // Recorrer todos los pasos expandidos
        expandedSteps.forEach((step, index) => {
          const { id: stepId, type: stepType } = step;
          
          // Welcome/thankyou siempre se consideran completados
          if (stepType === 'welcome' || stepType === 'thankyou') {
            completedStepIndices.add(index);
            return;
          }
          
          // Verificar directamente en localStorage
          const directResponse = loadFromLocalStorage(`response_${stepId}`);
          if (directResponse) {
            completedStepIndices.add(index);
            return;
          }
          
          // Buscar en all_steps primero
          if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            if (responsesData.modules.all_steps.some(resp => resp.stepId === stepId)) {
              completedStepIndices.add(index);
              return;
            }
          }
          
          // Buscar en categorías específicas
          if (stepType === 'demographic' && responsesData.modules.demographic) {
            if (responsesData.modules.demographic.stepId === stepId) {
              completedStepIndices.add(index);
            }
          } 
          else if (step.name?.includes('Que te ha parecido el módulo') && responsesData.modules.feedback) {
            if (responsesData.modules.feedback.stepId === stepId) {
              completedStepIndices.add(index);
            }
          }
          else if (stepType.startsWith('cognitive_') && Array.isArray(responsesData.modules.cognitive_task)) {
            if (responsesData.modules.cognitive_task.some(resp => resp.stepId === stepId)) {
              completedStepIndices.add(index);
            }
          }
          else if (stepType.startsWith('smartvoc_') && Array.isArray(responsesData.modules.smartvoc)) {
            if (responsesData.modules.smartvoc.some(resp => resp.stepId === stepId)) {
              completedStepIndices.add(index);
            }
          }
          else if (stepType.startsWith('eye_tracking_') && Array.isArray(responsesData.modules.eye_tracking)) {
            if (responsesData.modules.eye_tracking.some(resp => resp.stepId === stepId)) {
              completedStepIndices.add(index);
            }
          }
          else {
            // Buscar en categoría dinámica
            const moduleCategory = stepType.split('_')[0] || 'other';
            const moduleResponses = responsesData.modules[moduleCategory];
            
            if (Array.isArray(moduleResponses)) {
              if (moduleResponses.some(resp => resp.stepId === stepId)) {
                completedStepIndices.add(index);
              }
            }
          }
        });
        
        // Marcar todos los pasos hasta maxVisitedIndex como completados
        for (let i = 0; i <= maxVisitedIndex; i++) {
          completedStepIndices.add(i);
        }
        
        return Array.from(completedStepIndices).sort((a, b) => a - b);
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
          
          console.log('[ParticipantStore] localStorage limpiado correctamente');
        } catch (e) {
          console.error('[ParticipantStore] Error limpiando localStorage:', e);
        }
        
        // Resetear estado
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
      name: 'participant-storage', // Nombre del espacio de almacenamiento
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        // Solo persistir lo necesario para recuperar la sesión
        const persistedState = {
          token: state.token,
          researchId: state.researchId,
          participantId: state.participantId,
          maxVisitedIndex: state.maxVisitedIndex,
          responsesData: state.responsesData
        };
        // Usar type assertion para evitar errores de tipado
        return persistedState as unknown as ParticipantState;
      },
      // Mayor frecuencia de almacenamiento
      version: 1,
      onRehydrateStorage: (state) => {
        return (restoredState, error) => {
          if (error) {
            console.error('[ParticipantStore] Error recargando estado de Zustand:', error);
          }
          
          if (restoredState) {
            // Intentar cargar datos adicionales de localStorage
            try {
              const storedResponses = loadFromLocalStorage('participantResponses');
              if (storedResponses && Object.keys(storedResponses).length > 0) {
                console.log('[ParticipantStore] Respuestas encontradas en localStorage, restaurando...');
                
                // Combinar con estado recuperado
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
            
            console.log('[ParticipantStore] Estado recargado correctamente:', restoredState);
          }
        };
      }
    }
  )
); 