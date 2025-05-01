import { useState, useEffect, useCallback } from 'react';
import { ParticipantFlowStep, ExpandedStep } from '../types/flow';
import { Participant } from '../../../shared/interfaces/participant';
// Quitar flowSequence si ya no se usa
// import { flowSequence } from '../utils/utils'; 
import { Step as SidebarStep } from '../components/layout/ProgressSidebar';

// --- Constantes y Tipos (Ajustar según sea necesario) ---
const API_BASE_URL = 'https://d5x2q3te3j.execute-api.us-east-1.amazonaws.com/dev'; // O desde config/env

// Secuencia principal de módulos (Define el orden general)
const flowModuleSequence = ['welcome', 'cognitive_task', 'smartvoc', 'thankyou'];

// Tipos de preguntas esperadas para cada módulo complejo (Para generar mocks si faltan)
// <<< ¡IMPORTANTE: Asegúrate que estos strings coincidan con los `type` de las preguntas en la API! >>>
// const expectedCognitiveTypes = ['short_text', 'long_text']; // Añade todos los tipos cognitivos que esperas
// const expectedSmartVOCTypes = ['CSAT', 'CES', 'CV', 'NPS', 'NEV', 'VOC']; // Tipos de la API SmartVOC

// Mapeo de tipos API SmartVOC a tipos usados en el frontend renderer (CurrentStepRenderer)
// <<< ¡IMPORTANTE: Asegúrate que las claves coincidan con expectedSmartVOCTypes y los valores con los `case` en CurrentStepRenderer! >>>
const smartVOCTypeMap: { [key: string]: string } = {
    'CSAT': 'smartvoc_csat',
    'CES': 'smartvoc_ces',   // Necesita case 'smartvoc_ces' en Renderer
    'CV': 'smartvoc_cv',     // Necesita case 'smartvoc_cv' en Renderer
    'NPS': 'smartvoc_nps',   // Necesita case 'smartvoc_nps' en Renderer
    'NEV': 'smartvoc_nev',   // Necesita case 'smartvoc_nev' en Renderer
    'VOC': 'smartvoc_feedback', // Mapea a 'smartvoc_feedback' que ya existe
};
// ----------------------------------------------------

// Definir un tipo más específico para los pasos expandidos
// type ExpandedStep = SidebarStep & { type: string; config?: any }; // <<< MOVER a types/flow.ts (asumido hecho)

// El hook recibe el researchId como argumento (si es null/undefined, no debería hacer nada)
export const useParticipantFlow = (researchId: string | undefined) => {
    const [token, setToken] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<ParticipantFlowStep>(ParticipantFlowStep.LOADING_SESSION);
    const [error, setError] = useState<string | null>(null); 
    const [expandedSteps, setExpandedSteps] = useState<ExpandedStep[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [isFlowLoading, setIsFlowLoading] = useState<boolean>(true);

    // --- Lógica de Error --- 
    // useCallback para que la referencia sea estable
    const handleError = useCallback((errorMessage: string, step: ParticipantFlowStep | string) => {
        const stepName = typeof step === 'string' ? step : ParticipantFlowStep[step];
        console.error(`[useParticipantFlow] Error en ${stepName}:`, errorMessage);
        setError(`Error en ${stepName}: ${errorMessage}`);
        setCurrentStep(ParticipantFlowStep.ERROR);
        setIsFlowLoading(false); 
    }, []);

    // --- Función para Construir Pasos Expandidos (CORREGIDA) ---
    const buildExpandedSteps = useCallback(async (currentResearchId: string, currentToken: string) => {
        console.log("[useParticipantFlow] Iniciando construcción de pasos expandidos (Iterando API real)...");
        setIsFlowLoading(true);
        const finalSteps: ExpandedStep[] = [];

        try {
            // 1. Añadir Bienvenida
            finalSteps.push({ id: 'welcome', name: 'Bienvenida', type: 'welcome', config: { title: '¡Bienvenido!', message: 'Gracias por tu tiempo.' } });

            // 2. Procesar Cognitive Task
            try {
                const url = `${API_BASE_URL}/research/${currentResearchId}/cognitive-task`;
                console.log(`[useParticipantFlow] Fetching Cognitive Task: ${url}`);
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                if (response.ok) {
                    const data = await response.json();
                    const realCognitiveQuestions = data?.questions || [];
                    console.log(`[useParticipantFlow] Cognitive Task: ${realCognitiveQuestions.length} preguntas recibidas.`);
                    
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

            // 3. Procesar SmartVOC
            try {
                const url = `${API_BASE_URL}/research/${currentResearchId}/smart-voc`;
                console.log(`[useParticipantFlow] Fetching SmartVOC: ${url}`);
                const response = await fetch(url, { headers: { 'Authorization': `Bearer ${currentToken}` } });
                 if (response.ok) {
                    const data = await response.json();
                    const realSmartVOCQuestions = data?.data?.questions || data?.questions || [];
                    console.log(`[useParticipantFlow] SmartVOC: ${realSmartVOCQuestions.length} preguntas recibidas.`);

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

            // 4. Añadir Agradecimiento
            finalSteps.push({ id: 'thankyou', name: 'Agradecimiento', type: 'thankyou', config: { title: '¡Muchas Gracias!', message: 'Hemos recibido tus respuestas.' } });
            
            // --- Finalizar construcción ---
            if (finalSteps.length <= 2) { // Solo Welcome y Thankyou si todo falló o no había preguntas
                 console.warn("[useParticipantFlow] No se generaron pasos de preguntas reales.");
                 // Podríamos mostrar un error o solo welcome/thankyou
                 // handleError("No se encontraron preguntas para esta investigación.", ParticipantFlowStep.LOADING_SESSION);
                 // return; 
             }

            console.log(`[useParticipantFlow] Construcción finalizada. ${finalSteps.length} pasos totales.`);
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
        if (researchId) {
            console.log(`[useParticipantFlow] useEffect init. researchId: ${researchId}`);
            setToken(null);
            setCurrentStep(ParticipantFlowStep.LOADING_SESSION);
            setError(null);
            setExpandedSteps([]);
            setCurrentStepIndex(0);
            setIsFlowLoading(true);

            const storedToken = localStorage.getItem('participantToken');
            if (storedToken) {
                console.log("[useParticipantFlow] Token encontrado. Construyendo flujo...");
                setToken(storedToken);
                buildExpandedSteps(researchId, storedToken); // Llamar directamente a la función useCallback
            } else {
                console.log("[useParticipantFlow] No hay token. Pasando a Login.");
                setCurrentStep(ParticipantFlowStep.LOGIN);
                setIsFlowLoading(false);
            }
        } else {
             handleError('No se proporcionó ID de investigación.', ParticipantFlowStep.LOADING_SESSION);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [researchId]); // buildExpandedSteps se llama desde aquí, no necesita ser dependencia directa si se usa useCallback bien.

    // --- Lógica de Transiciones (ajustada) ---
    const handleLoginSuccess = useCallback((participant: Participant) => {
        console.log("[useParticipantFlow] Login exitoso. Construyendo flujo...");
        const storedToken = localStorage.getItem('participantToken');
        if (storedToken && researchId) {
            setToken(storedToken);
            setError(null);
            setIsFlowLoading(true);
            setCurrentStep(ParticipantFlowStep.LOADING_SESSION);
            buildExpandedSteps(researchId, storedToken); // Llamar directamente
        } else {
            handleError("Error interno post-login: Falta token o ID.", ParticipantFlowStep.LOGIN);
            setIsFlowLoading(false);
        }
    }, [researchId, buildExpandedSteps]); // Mantener dependencia de buildExpandedSteps

    const goToNextStep = useCallback(() => {
        if (!isFlowLoading && currentStepIndex < expandedSteps.length - 1) {
            const nextIndex = currentStepIndex + 1;
            const nextStepInfo = expandedSteps[nextIndex];
            console.log(`[useParticipantFlow] Avanzando a paso ${nextIndex} (${nextStepInfo?.id}).`);
            setCurrentStepIndex(nextIndex);
            // No actualizar currentStep (enum)
            setError(null); 
        } else if (!isFlowLoading) {
             console.log(`[useParticipantFlow] Último paso (${expandedSteps[currentStepIndex]?.id}) completado.`);
             setCurrentStep(ParticipantFlowStep.DONE);
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading]);

    // <<< NUEVO navigateToStep >>>
    const navigateToStep = useCallback((targetIndex: number) => {
        // Permitir navegación solo a pasos anteriores y si el flujo está cargado
        if (!isFlowLoading && targetIndex >= 0 && targetIndex < currentStepIndex) {
            const targetStepInfo = expandedSteps[targetIndex];
            console.log(`[useParticipantFlow] Navegando atrás al paso ${targetIndex} (${targetStepInfo?.id}).`);
            setCurrentStepIndex(targetIndex);
            // No actualizar currentStep (enum), ya no se usa para pasos individuales
            setError(null); 
        } else if (targetIndex === currentStepIndex) {
             console.log("[useParticipantFlow] Clic en el paso actual, no se navega.");
        } else {
             console.warn(`[useParticipantFlow] Navegación bloqueada al índice ${targetIndex} (inválido o futuro).`);
        }
    }, [currentStepIndex, expandedSteps, isFlowLoading]);

    // Eliminar handleStepComplete y handleNavigation si ya no se usan
    /*
    const handleStepComplete = useCallback(() => { ... });
    const handleNavigation = useCallback((targetStep: ParticipantFlowStep) => { ... });
    */

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
        navigateToStep, // <<< Exponer la nueva función
    };
}; 