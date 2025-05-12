import { useState, useEffect, useCallback, useRef } from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../types/flow';
import { Participant } from '../../../shared/interfaces/participant';
import { DEFAULT_DEMOGRAPHICS_CONFIG } from '../types/demographics';
import { useParticipantStore } from '../stores/participantStore';
import { apiClient } from '../lib/api';
import { useResponseAPI } from './useResponseAPI';

const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev';

const smartVOCTypeMap: { [key: string]: string } = {
    'CSAT': 'smartvoc_csat',
    'CES': 'smartvoc_ces',
    'CV': 'smartvoc_cv',
    'NPS': 'smartvoc_nps',
    'NEV': 'smartvoc_nev',
    'VOC': 'smartvoc_feedback',
};

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
        cognitive_task: ModuleResponse[];
        smartvoc: ModuleResponse[];
        all_steps: ModuleResponse[];
        [key: string]: ModuleResponse | ModuleResponse[] | undefined;
    };
}

// Estados de la carga de investigación
export enum ResearchLoadStatus {
    NOT_STARTED = 'not_started',
    LOADING = 'loading',
    LOADED = 'loaded',
    ERROR = 'error'
}

const DEFAULT_RESPONSES_DATA: ResponsesData = {
    researchId: '',
    startTime: Date.now(),
    modules: {
        cognitive_task: [],
        smartvoc: [],
        all_steps: []
    }
};

const sanitizeForJSON = (obj: any): any => {
    if (!obj) return obj;
    
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (key.startsWith('__react')) return undefined;
        
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return '[Referencia Circular]';
            }
            seen.add(value);
            
            if (typeof window !== 'undefined' && 
                (value instanceof Element || value instanceof HTMLElement)) {
                return '[Elemento DOM]';
            }
            
            if ('current' in value && typeof window !== 'undefined' && 
                (value.current instanceof Element || value.current instanceof HTMLElement)) {
                return '[React Ref]';
            }
        }
        
        return value;
    }));
};

// <<< OBTENER ACCIÓN DEL STORE >>>
const useStoreSetLoadedResponses = () => useParticipantStore(state => state.setLoadedResponses);

// NUEVO: Función para cargar respuestas existentes desde el API (MOVIDA AQUÍ)
// MODIFICADO: Ya no necesita setResponsesData, usará la acción del store
const loadExistingResponses = async (researchId: string, participantId: string, responseAPI: any, storeSetLoadedResponses: Function) => {
    if (!researchId || !participantId) {
        console.warn('[useParticipantFlow] No se pueden cargar respuestas sin researchId o participantId');
        return;
    }
    
    try {
        const responses = await responseAPI.getResponses();
        console.log('Responses cargadas:', responses);
        
        if (!responses) {
            return;
        }
        
        const actualResponsesArray = responses?.responses;

        if (Array.isArray(actualResponsesArray)) {
             storeSetLoadedResponses(actualResponsesArray); // Pasar el array de respuestas al store
        } else {
            // Manejar el caso donde la estructura no es la esperada o no hay 'responses'
            if (responses && typeof responses === 'object' && !actualResponsesArray) {
                 storeSetLoadedResponses([]);
            } else {
                 console.warn('[useParticipantFlow] Formato de respuesta inesperado o vacío al cargar:', responses);
                 storeSetLoadedResponses([]); // Pasar array vacío en caso de formato inesperado
            }
        }
        
    } catch (error) {
        console.error('[useParticipantFlow] Error cargando respuestas existentes:', error);
    }
};

export const useParticipantFlow = (researchId: string | undefined) => {
    const storeSetResearchId = useParticipantStore(state => state.setResearchId);
    const storeSetLoadedResponses = useStoreSetLoadedResponses(); 

    const [token, setToken] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<ParticipantFlowStep>(ParticipantFlowStep.LOADING_SESSION);
    const [error, setError] = useState<string | null>(null); 
    const [expandedSteps, setExpandedSteps] = useState<ExpandedStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isFlowLoading, setIsFlowLoading] = useState<boolean>(true);
    const [maxVisitedIndex, setMaxVisitedIndex] = useState<number>(0);
    
    const [responsesData, setResponsesData] = useState<ResponsesData>({
        researchId: researchId || '',
        startTime: Date.now(),
        modules: {
            cognitive_task: [],
            smartvoc: [],
            all_steps: []
        }
    });

    // MODIFICADO: Seleccionar directamente el valor primitivo
    const participantId = useParticipantStore(state => state.participantId);
    // <<< SELECCIONAR all_steps DIRECTAMENTE >>>
    const loadedApiResponses = useParticipantStore(state => state.responsesData.modules.all_steps);

    const responseAPI = useResponseAPI({
        researchId: researchId || '',
        participantId: participantId || ''
    });

    const initialResponsesLoadedRef = useRef<boolean>(false);

    const handleError = useCallback((errorMessage: string, step: ParticipantFlowStep | string) => {
        const stepName = typeof step === 'string' ? step : ParticipantFlowStep[step];
        console.error(`[useParticipantFlow] Error en ${stepName}:`, errorMessage);
        setError(`Error en ${stepName}: ${errorMessage}`);
        setCurrentStep(ParticipantFlowStep.ERROR);
        setIsFlowLoading(false); 
    }, []);

    const buildExpandedSteps = useCallback(async (currentResearchId: string, currentToken: string) => {
        setIsFlowLoading(true);
        const finalSteps: ExpandedStep[] = [];

        try {
            finalSteps.push({ id: 'demographic', name: 'Preguntas demográficas', type: 'demographic', config: { 
                title: 'Preguntas demográficas', 
                description: 'Por favor, responde a unas breves preguntas demográficas antes de comenzar.',
                demographicsConfig: DEFAULT_DEMOGRAPHICS_CONFIG
            } });
            
            // 2. Añadir Bienvenida
            finalSteps.push({ id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Gracias por tu tiempo.' } });
            
            // 3. Obtener estructura de flujo completo (todos los módulos)
            try {
                const flowUrl = `${API_BASE_URL}/research/${currentResearchId}/flow`;
                const flowResponse = await fetch(flowUrl, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                
                if (flowResponse.ok) {
                    const flowData = await flowResponse.json();
                    const moduleSteps = flowData?.data || [];
                    
                }
            } catch (flowError: any) {
                console.error('[useParticipantFlow] Error obteniendo estructura de flujo:', flowError);
                // Continuar con los módulos conocidos sin detener por error
            }
            
            // 4. Procesar Cognitive Task (mantener por compatibilidad)
            try {
                const url = `${API_BASE_URL}/research/${currentResearchId}/cognitive-task`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                if (response.ok) {
                    const data = await response.json();
                    const realCognitiveQuestions = data?.questions || [];
                    
                    // <<< ITERAR SOBRE PREGUNTAS REALES COGNITIVAS >>>
                    for (const question of realCognitiveQuestions) {
                        const frontendType = `cognitive_${question.type}`;
                        // Validar si tenemos un componente para este tipo en CurrentStepRenderer
                        // if (!isKnownFrontendType(frontendType)) continue;
                        finalSteps.push({
                            id: question.id || `${frontendType}_${finalSteps.length}`,
                            name: question.title || `Cognitiva: ${question.type || 'Desconocido'}`, // Usar title o type
                            type: frontendType,
                            config: question // Pasar toda la config de la pregunta
                        });
                    }
                } else {
                    console.error(`[useParticipantFlow] Fetch Cognitive Task falló (${response.status} ${response.statusText}).`);
                    // Podríamos decidir parar el flujo o continuar sin pasos cognitivos
                     handleError(`Error al cargar tareas cognitivas (${response.status})`, 'cognitive_task');
                     return; // Salir si falla la carga de un módulo esencial?
                }
            } catch (fetchError: any) {
                console.error('[useParticipantFlow] Excepción fetching Cognitive Task:', fetchError);
                handleError(fetchError.message || 'Error de red cargando tareas cognitivas', 'cognitive_task');
                return;
            }

            // 5. Procesar SmartVOC (mantener por compatibilidad)
            try {
                const url = `${API_BASE_URL}/research/${currentResearchId}/smart-voc`;
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                 if (response.ok) {
                    const data = await response.json();
                    const realSmartVOCQuestions = data?.data?.questions || data?.questions || [];

                    // <<< ITERAR SOBRE PREGUNTAS REALES SMARTVOC >>>
                    for (const question of realSmartVOCQuestions) {
                         const frontendType = smartVOCTypeMap[question.type?.toUpperCase()];
                         if (!frontendType) {
                             console.warn(`[useParticipantFlow] No hay mapeo frontend para tipo SmartVOC API: ${question.type}`);
                             continue; // Saltar si no sabemos cómo renderizarlo
                         }
                         finalSteps.push({
                            id: question.id || `${frontendType}_${finalSteps.length}`,
                            name: question.title || `Feedback: ${question.type || 'Desconocido'}`, // Usar title o type
                            type: frontendType,
                            config: question // Pasar toda la config
                         });
                     }
                 } else {
                     console.error(`[useParticipantFlow] Fetch SmartVOC falló (${response.status} ${response.statusText}).`);
                     // Continuar sin pasos SmartVOC o manejar error
                     // Si SmartVOC es opcional, podríamos no llamar a handleError aquí
                     // handleError(`Error al cargar feedback (${response.status})`, 'smartvoc');
                     // return;
                 }
            } catch (fetchError: any) {
                 console.error('[useParticipantFlow] Excepción fetching SmartVOC:', fetchError);
                 // handleError(fetchError.message || 'Error de red cargando feedback', 'smartvoc');
                 // return;
            }

            // 6. Obtener y procesar otros módulos potenciales genéricamente
            try {
                // Endpoint para obtener lista de todos los módulos disponibles
                const modulesUrl = `${API_BASE_URL}/research/${currentResearchId}/modules`;
                const modulesResponse = await fetch(modulesUrl, { 
                    headers: { 'Authorization': `Bearer ${currentToken}` },
                    // Usar método HEAD para verificar si el endpoint existe
                    method: 'HEAD'
                });
                
                // Solo proceder si el endpoint existe
                if (modulesResponse.ok) {
                    const modulesListResponse = await fetch(modulesUrl, { 
                        headers: { 'Authorization': `Bearer ${currentToken}` }
                    });
                    
                    if (modulesListResponse.ok) {
                        const modulesList = await modulesListResponse.json();
                        const modules = modulesList?.modules || [];
                        
                        // Procesar cada módulo de la lista
                        for (const module of modules) {
                            // Evitar procesar módulos ya manejados anteriormente
                            if (['cognitive_task', 'smartvoc'].includes(module.type)) {
                                continue;
                            }
                            
                            // Obtener preguntas para este módulo específico
                            try {
                                const moduleUrl = `${API_BASE_URL}/research/${currentResearchId}/${module.type}`;
                                const moduleResponse = await fetch(moduleUrl, { 
                                    headers: { 'Authorization': `Bearer ${currentToken}` }
                                });
                                
                                if (moduleResponse.ok) {
                                    const moduleData = await moduleResponse.json();
                                    const questions = moduleData?.questions || [];
                                    
                                    // Procesar preguntas del módulo
                                    for (const question of questions) {
                                        const frontendType = `${module.type}_${question.type || 'question'}`;
                                        finalSteps.push({
                                            id: question.id || `${frontendType}_${finalSteps.length}`,
                                            name: question.title || `${module.name}: ${question.type || 'Pregunta'}`,
                                            type: frontendType,
                                            config: question
                                        });
                                    }
                                }
                            } catch (moduleError) {
                                console.error(`[useParticipantFlow] Error obteniendo módulo ${module.type}:`, moduleError);
                                // Continuar con otros módulos
                            }
                        }
                    }
                }
            } catch (modulesError) {
                console.error('[useParticipantFlow] Error obteniendo lista de módulos:', modulesError);
                // Continuar con el flujo normal
            }

            // 7. Añadir Agradecimiento
            finalSteps.push({ id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Hemos recibido tus respuestas.' } });
            
            // --- Finalizar construcción ---
            if (finalSteps.length <= 2) { // Solo Welcome y Thankyou si todo falló o no había preguntas
                 console.warn("[useParticipantFlow] No se generaron pasos de preguntas reales.");
                 // Podríamos mostrar un error o solo welcome/thankyou
                 // handleError("No se encontraron preguntas para esta investigación.", ParticipantFlowStep.LOADING_SESSION);
                 // return; 
             }

            setExpandedSteps(finalSteps);
            setCurrentStepIndex(0);
            setCurrentStep(ParticipantFlowStep.WELCOME); 

        } catch (error: any) { // Catch errores inesperados en la lógica del bucle principal
            handleError(error.message || 'Error construyendo los pasos del flujo.', ParticipantFlowStep.LOADING_SESSION);
        } finally {
            setIsFlowLoading(false);
        }
    }, [handleError, researchId, token]); // <<< Añadir researchId y token como dependencias explícitas

    // --- Lógica de Inicialización (ajustada) ---
    useEffect(() => {
        if (!researchId) {
            console.warn("[useParticipantFlow] Research ID no definido en useEffect inicial.");
            handleError("ID de investigación no encontrado.", "Initialization");
            return;
        }

        setIsFlowLoading(true);
        storeSetResearchId(researchId); // Actualizar researchId en el store

        const initializeFlow = async () => {
            // 1. Recuperar sesión si existe
            const storedToken = localStorage.getItem('participantToken');
            const storedParticipantId = localStorage.getItem('participantId'); // Ajustar clave si es diferente
            
            if (storedToken && storedParticipantId) {
                setToken(storedToken);
                // No llamar a handleLoginSuccess aquí todavía, necesitamos construir los pasos primero
                
                // 2. Construir pasos expandidos
                await buildExpandedSteps(researchId, storedToken);
                
                // 3. Cargar respuestas existentes (AHORA DESPUÉS DE TENER PARTICIPANT ID)
                if (!initialResponsesLoadedRef.current) {
                     // MODIFICADO: Pasar la acción del store
                     await loadExistingResponses(researchId, storedParticipantId, responseAPI, storeSetLoadedResponses);
                     initialResponsesLoadedRef.current = true;
                 }

                // 4. Navegar al último paso visitado (si existe)
                const storedMaxIndex = parseInt(localStorage.getItem('maxVisitedIndex') || '0', 10);
                const storedCurrentIndex = parseInt(localStorage.getItem('currentStepIndex') || '0', 10);
                const targetIndex = Math.min(storedCurrentIndex, storedMaxIndex);
                
                if (targetIndex > 0 && targetIndex < expandedSteps.length) {
                    setCurrentStepIndex(targetIndex);
                    setMaxVisitedIndex(storedMaxIndex);
                    setCurrentStep(ParticipantFlowStep.WELCOME); 
                } else {
                    setCurrentStep(ParticipantFlowStep.LOGIN); // Si no hay sesión válida o índice guardado, ir a Login
                }
                setIsFlowLoading(false);
                
            } else {
                setCurrentStep(ParticipantFlowStep.LOGIN);
                setIsFlowLoading(false);
            }
        };

        initializeFlow();

    }, [researchId]); // Dependencia principal

    // --- Lógica de Transiciones (ajustada) ---
    const handleLoginSuccess = useCallback((participant: Participant & { id: string }) => { // Asegurar que participant tenga id
        const storedToken = localStorage.getItem('participantToken');
        const currentGlobalResearchId = useParticipantStore.getState().researchId;

        if (storedToken && currentGlobalResearchId && participant.id) { // Verificar participant.id
            // 1. Establecer en el store global
            useParticipantStore.getState().setToken(storedToken);
            // Asegurarse de que el objeto pasado a setParticipant cumpla con ParticipantInfo
            useParticipantStore.getState().setParticipant({ 
                id: participant.id, 
                name: participant.name, 
                email: participant.email 
            });

            // 2. Establecer en el estado local del hook
            setToken(storedToken);
            
            // 3. Continuar con la lógica del flujo
            setError(null);
            setIsFlowLoading(true);
            setCurrentStep(ParticipantFlowStep.LOADING_SESSION); 
            
            // Llamar a loadExistingResponses ANTES de setResponsesData para que los datos se carguen primero
            // Y pasar las dependencias necesarias a loadExistingResponses
            loadExistingResponses(currentGlobalResearchId, participant.id, responseAPI, storeSetLoadedResponses);

            setResponsesData(prev => ({ 
                ...prev,
                participantId: participant.id,
                researchId: currentGlobalResearchId
            }));
            
            buildExpandedSteps(currentGlobalResearchId, storedToken);
        } else {
            let errorMsg = "Error interno post-login: Faltan datos cruciales.";
            if (!storedToken) errorMsg += " No se encontró el token.";
            if (!currentGlobalResearchId) errorMsg += " No se encontró researchId en el store global.";
            if (!participant.id) errorMsg += " No se encontró participant.id en la respuesta del login.";
            console.error("[useParticipantFlow] handleLoginSuccess check failed:", { storedToken, currentGlobalResearchId, participantId: participant.id });
            handleError(errorMsg, ParticipantFlowStep.LOGIN);
            setIsFlowLoading(false);
        }
    }, [buildExpandedSteps, handleError, responseAPI]); // Quitar loadExistingResponses de aquí, se llama directamente

    // MODIFICADO: Función para guardar respuesta del paso actual - usando el nuevo endpoint
    const saveStepResponse = useCallback(async (answer: any) => {
        if (currentStepIndex >= 0 && currentStepIndex < expandedSteps.length) {
            const currentStepInfo = expandedSteps[currentStepIndex];
            const { id: stepId, type: stepType, name: stepName, config } = currentStepInfo;
            
            
            // Único caso a excluir: los pasos que no requieren respuesta del usuario
            // IMPORTANTE: Solo excluir Welcome/Thankyou si no tienen respuesta
            if ((stepType === 'welcome' || stepType === 'thankyou') && answer === undefined) {
                
                // Para el paso thankyou, actualizamos el tiempo de finalización pero no guardamos la respuesta
                if (stepType === 'thankyou') {
                    setResponsesData(prev => {
                        const finalData = {
                            ...prev,
                            endTime: Date.now()
                        };
                        
                        return finalData;
                    });
                }
                
                return;
            }
            
            // IMPORTANTE: Para pasos cognitive y smartvoc, nunca ignorar aunque answer parezca vacío
            const isCognitive = stepType.startsWith('cognitive_');
            const isSmartVOC = stepType.startsWith('smartvoc_');
            
            // Si answer es undefined pero es un paso cognitive o smartvoc, crear un objeto vacío
            // para garantizar que se guarde algo
            if (answer === undefined && (isCognitive || isSmartVOC)) {
                answer = isCognitive ? { text: "" } : { value: 0 };
            }
            
            // Crear objeto de respuesta para este paso
            const moduleResponse: ModuleResponse = {
                stepId,
                stepType,
                stepName,
                question: config?.questionText || config?.title || stepName,
                answer,
                timestamp: Date.now()
            };
            
            // Sanear la respuesta para asegurar que sea serializable
            try {
                // Solo sanitizar el answer que puede contener referencias a DOM
                moduleResponse.answer = sanitizeForJSON(moduleResponse.answer);
            } catch (sanitizeError) {
                console.warn('[useParticipantFlow] Error sanitizando respuesta:', sanitizeError);
                // En caso de error, convertir a string simple para asegurar compatibilidad
                moduleResponse.answer = String(moduleResponse.answer);
            }
            
            // NUEVO: Verificar que la respuesta no se haya perdido en el proceso de sanitización
            if (moduleResponse.answer === undefined || moduleResponse.answer === null) {
                console.warn('[useParticipantFlow] ALERTA: Respuesta perdida después de sanitizar');
                // Asignar un valor default según el tipo
                if (isCognitive) {
                    moduleResponse.answer = { text: "Respuesta no capturada correctamente" };
                } else if (isSmartVOC) {
                    moduleResponse.answer = { value: 0 };
                } else {
                    moduleResponse.answer = "Respuesta no capturada correctamente";
                }
            }
            
            // NUEVO: Usar el API para guardar la respuesta mediante el endpoint
            try {
                // Buscar si ya existe una respuesta para este paso (para actualización)
                const existingResponseId = findExistingResponseId(stepId);
                
                // Guardar o actualizar respuesta usando el endpoint
                const apiResult = await responseAPI.saveOrUpdateResponse(
                    stepId,
                    stepType,
                    stepName || '',
                    moduleResponse.answer,
                    existingResponseId
                );
                
                if (apiResult) {
                } else {
                    console.warn('[useParticipantFlow] No se recibió confirmación del API al guardar respuesta');
                }
            } catch (apiError) {
                console.error('[useParticipantFlow] Error guardando respuesta en API:', apiError);
                // Continuar con almacenamiento local a pesar del error en API
            }
            
            // Actualizar el estado con esta respuesta (mantener estado local además del API)
            setResponsesData(prev => {
                const updatedData = { ...prev };
                
                // ENFOQUE COMPLETO: Guardar en categoría específica Y en all_steps
                
                // 1. GUARDAR EN CATEGORÍA ESPECÍFICA
                if (stepType === 'demographic') {
                    // Caso especial: demographic es un objeto único
                    updatedData.modules.demographic = moduleResponse;
                } 
                else if (stepName?.includes('Que te ha parecido el módulo')) {
                    // Caso especial: feedback sobre el módulo
                    updatedData.modules.feedback = moduleResponse;
                }
                else if (stepType === 'welcome' && answer !== undefined) {
                    // Caso especial: bienvenida (solo si tiene respuesta)
                    updatedData.modules.welcome = moduleResponse;
                }
                else if (isCognitive) {
                    // MODIFICADO: Garantizar que se guarde siempre en cognitive_task
                    if (!updatedData.modules.cognitive_task) {
                        updatedData.modules.cognitive_task = [];
                    }
                    
                    // Verificar si ya existe una respuesta para este stepId
                    const existingIndex = updatedData.modules.cognitive_task.findIndex(
                        resp => resp.stepId === stepId
                    );
                    
                    if (existingIndex >= 0) {
                        // Actualizar respuesta existente
                        updatedData.modules.cognitive_task[existingIndex] = moduleResponse;
                    } else {
                        // Añadir nueva respuesta
                        updatedData.modules.cognitive_task.push(moduleResponse);
                    }
                    
                }
                else if (isSmartVOC) {
                    // MODIFICADO: Garantizar que se guarde siempre en smartvoc
                    if (!updatedData.modules.smartvoc) {
                        updatedData.modules.smartvoc = [];
                    }
                    
                    // Verificar si ya existe una respuesta para este stepId
                    const existingIndex = updatedData.modules.smartvoc.findIndex(
                        resp => resp.stepId === stepId
                    );
                    
                    if (existingIndex >= 0) {
                        // Actualizar respuesta existente
                        updatedData.modules.smartvoc[existingIndex] = moduleResponse;
                    } else {
                        // Añadir nueva respuesta
                        updatedData.modules.smartvoc.push(moduleResponse);
                    }
                    
                }
                else {
                    // Cualquier otro tipo: crear array dinámico por tipo
                    const moduleCategory = stepType.split('_')[0] || 'other';
                    if (!updatedData.modules[moduleCategory]) {
                        updatedData.modules[moduleCategory] = [];
                    }
                    
                    // Asegurar que es un array
                    if (!Array.isArray(updatedData.modules[moduleCategory])) {
                        updatedData.modules[moduleCategory] = [updatedData.modules[moduleCategory] as ModuleResponse];
                    }
                    
                    // Añadir respuesta
                    (updatedData.modules[moduleCategory] as ModuleResponse[]).push(moduleResponse);
                }
                
                // 2. GUARDAR EN ARRAY UNIVERSAL all_steps (SIEMPRE)
                if (!updatedData.modules.all_steps) {
                    updatedData.modules.all_steps = [];
                }
                
                // Verificar si ya existe en all_steps
                const allStepsIndex = updatedData.modules.all_steps.findIndex(
                    resp => resp.stepId === stepId
                );
                
                if (allStepsIndex >= 0) {
                    // Actualizar respuesta existente
                    updatedData.modules.all_steps[allStepsIndex] = moduleResponse;
                } else {
                    // Añadir nueva respuesta
                    updatedData.modules.all_steps.push(moduleResponse);
                }
                
                return updatedData;
            });
        }
    }, [currentStepIndex, expandedSteps, responseAPI]);
    
    // Función auxiliar para buscar ID de respuesta existente
    const findExistingResponseId = useCallback((stepId: string): string | undefined => {
        // Buscar en todas las respuestas guardadas si hay alguna para este stepId
        if (responsesData.modules.all_steps) {
            const existing = responsesData.modules.all_steps.find(resp => resp.stepId === stepId);
            if (existing && 'id' in existing) {
                return existing.id as string;
            }
        }
        return undefined;
    }, [responsesData.modules.all_steps]);

    // CORREGIDO: Función para verificar si un paso específico tiene respuesta guardada
    const hasStepBeenAnswered = useCallback((stepIndex: number): boolean => {
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return false;
        
        const step = expandedSteps[stepIndex];
        const { id: stepId, type: stepType } = step;
        
        // Excluir welcome/thankyou que no necesitan respuesta
        if (stepType === 'welcome' || stepType === 'thankyou') return true;
        
        // MÉTODO MÁS DIRECTO: Buscar primero en all_steps
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            if (responsesData.modules.all_steps.some(resp => resp.stepId === stepId)) {
                return true;
            }
        }
        
        // MÉTODO DE RESPALDO: Buscar en categorías específicas
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
        else {
            // Buscar en categoría dinámica
            const moduleCategory = stepType.split('_')[0] || 'other';
            const moduleResponses = responsesData.modules[moduleCategory];
            
            if (Array.isArray(moduleResponses)) {
                return moduleResponses.some(resp => resp.stepId === stepId);
            }
        }
        
        return false;
    }, [expandedSteps, responsesData]);

    // CORREGIDO: Función para obtener la respuesta de un paso específico
    const getStepResponse = useCallback((stepIndex: number): any => {
        if (stepIndex < 0 || stepIndex >= expandedSteps.length) return null;
        
        const step = expandedSteps[stepIndex];
        const { id: stepId, type: stepType } = step;
        
        // No hay respuestas para welcome/thankyou normalmente
        if (stepType === 'welcome' || stepType === 'thankyou') return null;
        
        // MÉTODO MÁS DIRECTO: Buscar primero en all_steps
        if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
            const response = responsesData.modules.all_steps.find(resp => resp.stepId === stepId);
            if (response) return response.answer;
        }
        
        // MÉTODO DE RESPALDO: Buscar en categorías específicas
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
    }, [expandedSteps, responsesData]);

    // MODIFICADO: goToNextStep para forzar persistencia en cognitive y smartvoc - sin localStorage
    const goToNextStep = useCallback(async (answer?: any) => {
        if (!isFlowLoading && currentStepIndex < expandedSteps.length - 1) {
            const currentStepInfo = expandedSteps[currentStepIndex];
            const { type: stepType } = currentStepInfo;
            
            // VERIFICAR si es un paso de tipo cognitive o smartvoc para garantizar que siempre se guarde
            const isCognitive = stepType.startsWith('cognitive_');
            const isSmartVOC = stepType.startsWith('smartvoc_');
            
            // Comprobar si debemos forzar un valor por defecto
            if (answer === undefined && (isCognitive || isSmartVOC)) {
                // Asignar valor por defecto según el tipo
                answer = isCognitive ? 
                    { text: "Respuesta vacía", isEmpty: true } : 
                    { value: 0, isEmpty: true };
            }
            
            // Guardar la respuesta antes de avanzar - SIEMPRE guardar si hay respuesta
            if (answer !== undefined) {
                await saveStepResponse(answer);
                
                // Actualizar también la configuración del paso actual para mantener las respuestas
                currentStepInfo.config = {
                    ...currentStepInfo.config,
                    savedResponses: answer
                };
            }
            
            const nextIndex = currentStepIndex + 1;
            const nextStepInfo = expandedSteps[nextIndex];
            
            // Actualizar el índice máximo visitado si estamos avanzando a un paso nuevo
            if (nextIndex > maxVisitedIndex) {
                setMaxVisitedIndex(nextIndex);
                // Ya no guardamos en localStorage, solo en el estado de React
            }
            
            setCurrentStepIndex(nextIndex);
            setError(null); 
        } else if (!isFlowLoading) {
             
             // Guardar la respuesta final - SIEMPRE si hay respuesta
             if (answer !== undefined) {
                await saveStepResponse(answer);
             }
             
             // Finalizar flujo y enviar respuestas
             setCurrentStep(ParticipantFlowStep.DONE);
             setResponsesData(prev => {
                 const finalData = { 
                     ...prev,
                     endTime: Date.now()
                 };
                 
                 return finalData;
             });

             // NUEVO: Marcar respuestas como completadas en el API
             try {
                const result = await responseAPI.markAsCompleted();
                if (result) {
                } else {
                    console.warn('[useParticipantFlow] No se recibió confirmación al marcar respuestas como completadas.');
                }
             } catch (error) {
                console.error('[useParticipantFlow] Error marcando respuestas como completadas:', error);
                // Continuar a pesar del error
             }
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading, saveStepResponse, maxVisitedIndex, researchId, responseAPI]);

    // CORREGIDO: Función para obtener los índices de todos los pasos que tienen respuestas
    const getAnsweredStepIndices = useCallback((): number[] => {
        // Crear un Set para rastrear los índices de pasos completados o visitados
        const completedStepIndices = new Set<number>();
        
        // Recorrer todos los pasos expandidos
        expandedSteps.forEach((step, index) => {
            const { id: stepId, type: stepType } = step;
            
            // Welcome/thankyou siempre se consideran completados
            if (stepType === 'welcome' || stepType === 'thankyou') {
                completedStepIndices.add(index);
                return;
            }
            
            // MÉTODO DIRECTO: Verificar en all_steps primero
            if (responsesData.modules.all_steps && Array.isArray(responsesData.modules.all_steps)) {
                if (responsesData.modules.all_steps.some(resp => resp.stepId === stepId)) {
                    completedStepIndices.add(index);
                    return; // Encontrado, no seguir buscando
                }
            }
            
            // RESPALDO: Verificar en categorías específicas
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
        
        // Marcar como completados todos los pasos que el usuario ha visitado (hasta maxVisitedIndex)
        // Esto garantiza que todos los pasos por los que el usuario ha pasado aparezcan como completados
        for (let i = 0; i <= maxVisitedIndex; i++) {
            completedStepIndices.add(i);
        }
        
        return Array.from(completedStepIndices).sort((a, b) => a - b);
    }, [expandedSteps, responsesData, maxVisitedIndex]);

    // RESTAURAR: Función navigateToStep correcta para permitir navegar a cualquier paso ya visitado
    // IMPORTANTE: Mover esta definición DESPUÉS de getStepResponse y getAnsweredStepIndices para mantener el orden de los hooks
    const navigateToStep = useCallback((targetIndex: number) => {
        const answeredSteps = getAnsweredStepIndices();
        const isAnsweredStep = answeredSteps.includes(targetIndex);
        
        if (!isFlowLoading && targetIndex >= 0 && (targetIndex <= maxVisitedIndex || isAnsweredStep)) {

            // Intentar recuperar la respuesta guardada para el paso de destino
            const savedResponse = getStepResponse(targetIndex);

            // Solo actualizar el estado si encontramos una respuesta guardada
            if (savedResponse !== null && savedResponse !== undefined) {
                setExpandedSteps(prevSteps => {
                    const newSteps = [...prevSteps]; // Crear copia del array
                    const targetStep = newSteps[targetIndex];
                    if (targetStep) {
                        // Solo actualizar si la respuesta guardada es diferente a la que ya tiene
                        if (targetStep.config?.savedResponses !== savedResponse) {
                            // Crear una nueva config para el paso
                            targetStep.config = {
                                ...targetStep.config,
                                savedResponses: savedResponse
                            };
                        } else {
                        }
                    }
                    return newSteps; // Devolver el nuevo array
                });
            }
            
            // IMPORTANTE: Establecer el índice del paso actual al paso seleccionado
            setCurrentStepIndex(targetIndex);
            setError(null); 
        } else if (targetIndex === currentStepIndex) {
        } else {
            console.warn(`[useParticipantFlow] Navegación bloqueada al índice ${targetIndex}.`);
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading, getStepResponse, maxVisitedIndex, getAnsweredStepIndices]);
    
    const totalRelevantSteps = Math.max(0, expandedSteps.length - 2);
    let completedRelevantSteps = 0;
    if (currentStepIndex > 0 && expandedSteps.length > 2) {
        // Si el índice es mayor que 0 (no estamos en Welcome) y hay pasos relevantes
        completedRelevantSteps = Math.min(currentStepIndex, totalRelevantSteps); 
        // Si estamos en ThankYou (índice final), contamos todos los relevantes como completados
        if (currentStepIndex === expandedSteps.length - 1) {
             completedRelevantSteps = totalRelevantSteps;
        }
    }
    // Si el flujo ha terminado (estado DONE), consideramos todos completados
    if (currentStep === ParticipantFlowStep.DONE) {
        completedRelevantSteps = totalRelevantSteps;
    }
    
    // Función para obtener el JSON de respuestas actual
    const getResponsesJson = useCallback(() => {
        return JSON.stringify(responsesData, null, 2);
    }, [responsesData]);

    // --- Valor de Retorno (ACTUALIZADO) --- 
    return {
        currentStep,
        token,
        error,
        handleLoginSuccess,
        handleStepComplete: goToNextStep,
        handleError,
        expandedSteps,
        currentStepIndex,
        isFlowLoading,
        navigateToStep, // Usar la función navigateToStep real
        completedRelevantSteps,
        totalRelevantSteps,
        responsesData,
        getResponsesJson,
        hasStepBeenAnswered,
        getAnsweredStepIndices,
        getStepResponse,
        maxVisitedIndex,
        // <<< DEVOLVER all_steps >>>
        loadedApiResponses 
    };
}; 