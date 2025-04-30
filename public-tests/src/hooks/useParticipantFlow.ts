import { useState, useEffect, useCallback } from 'react';
import { ParticipantFlowStep } from '../types/flow';
import { Participant } from '../../../shared/interfaces/participant';
import { flowSequence } from '../utils/utils';

// El hook recibe el researchId como argumento (si es null/undefined, no debería hacer nada)
export const useParticipantFlow = (researchId: string | undefined) => {
    const [token, setToken] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<ParticipantFlowStep>(ParticipantFlowStep.LOADING_SESSION);
    const [error, setError] = useState<string | null>(null); 

    // --- Lógica de Error --- 
    // useCallback para que la referencia sea estable
    const handleError = useCallback((errorMessage: string, step: ParticipantFlowStep) => {
        console.error(`[useParticipantFlow] Error en ${ParticipantFlowStep[step]}:`, errorMessage);
        setError(`Error en ${ParticipantFlowStep[step]}: ${errorMessage}`);
        setCurrentStep(ParticipantFlowStep.ERROR);
    }, []); // No depende de nada externo que cambie

    // --- Lógica de Inicialización --- 
    useEffect(() => {
        // Solo inicializar si tenemos un researchId
        if (researchId) {
            console.log(`[useParticipantFlow] Iniciando. researchId: ${researchId}`);
            // Resetear estados al cambiar researchId (o al montar inicialmente)
            setToken(null);
            setCurrentStep(ParticipantFlowStep.LOADING_SESSION);
            setError(null); 

            const storedToken = localStorage.getItem('participantToken');
            if (storedToken) {
                console.log("[useParticipantFlow] Token encontrado. Pasando a Welcome.");
                setToken(storedToken);
                setCurrentStep(ParticipantFlowStep.WELCOME);
            } else {
                console.log("[useParticipantFlow] No hay token. Pasando a Login.");
                // No seteamos token (ya es null)
                setCurrentStep(ParticipantFlowStep.LOGIN);
            }
        } else {
            // Si no hay researchId, marcar error inmediatamente
             console.error('[useParticipantFlow] No se proporcionó ID de investigación.');
             // Usar el handleError definido arriba
             handleError('No se proporcionó ID de investigación.', ParticipantFlowStep.LOADING_SESSION);
        }
    }, [researchId, handleError]); // Depender de researchId y handleError

    // --- Lógica de Transiciones --- 
    const handleLoginSuccess = useCallback((_participant: Participant) => { 
        console.log("[useParticipantFlow] Login exitoso. Recuperando token y pasando a Welcome.");
        const storedToken = localStorage.getItem('participantToken');
        if (storedToken && researchId) { 
            setToken(storedToken);
            setError(null);
            setCurrentStep(flowSequence[0] || ParticipantFlowStep.WELCOME); // Ir al primer paso definido
        } else {
            console.error("[useParticipantFlow] Error crítico post-login: Falta token o researchId.");
            handleError("Error interno al procesar el inicio de sesión.", ParticipantFlowStep.LOGIN);
        }
    }, [researchId, handleError]); // Depender de researchId y handleError

    const handleStepComplete = useCallback(() => {
        const currentIndex = flowSequence.indexOf(currentStep);
        if (currentIndex !== -1 && currentIndex < flowSequence.length - 1) {
            const nextStep = flowSequence[currentIndex + 1];
            console.log(`[useParticipantFlow] Step ${ParticipantFlowStep[currentStep]} completado. Pasando a ${ParticipantFlowStep[nextStep]}.`);
            setCurrentStep(nextStep);
            setError(null); 
        } else if (currentIndex === flowSequence.length - 1 || currentStep === ParticipantFlowStep.DONE) {
            console.log(`[useParticipantFlow] Último paso (${ParticipantFlowStep[currentStep]}) completado.`);
             if(currentStep !== ParticipantFlowStep.DONE) setCurrentStep(ParticipantFlowStep.DONE);
        } else {
            console.warn(`[useParticipantFlow] handleStepComplete llamado desde paso inesperado: ${ParticipantFlowStep[currentStep]}`);
        }
    }, [currentStep]); // Depende de currentStep

    const handleNavigation = useCallback((targetStep: ParticipantFlowStep) => {
        if (targetStep === ParticipantFlowStep.SMART_VOC || targetStep === ParticipantFlowStep.COGNITIVE_TASK) {
            const canNavigateManually = 
                currentStep === ParticipantFlowStep.WELCOME ||
                currentStep === ParticipantFlowStep.SMART_VOC ||
                currentStep === ParticipantFlowStep.COGNITIVE_TASK;
            
            if (canNavigateManually && researchId && token) { 
                console.log(`[useParticipantFlow] Navegando a ${ParticipantFlowStep[targetStep]}.`);
                setCurrentStep(targetStep);
                setError(null);
            } else {
                 let blockReason = [];
                 if (!canNavigateManually) blockReason.push("estado actual no permite");
                 if (!researchId) blockReason.push("falta researchId");
                 if (!token) blockReason.push("falta token");
                 console.warn(`[useParticipantFlow] Navegación bloqueada (${blockReason.join(', ')}).`);
            }
        } else {
            console.warn(`[useParticipantFlow] Intento de navegación no válido a ${ParticipantFlowStep[targetStep]}.`);
        }
    }, [currentStep, researchId, token]); // Depende de estos

    // --- Valor de Retorno --- 
    // Devolver el estado y las funciones necesarias para el componente UI
    return {
        currentStep,
        token,
        error,
        handleLoginSuccess,
        handleStepComplete,
        handleError, // Aunque CurrentStepRenderer también lo usa, el componente padre lo necesita para el estado ERROR global
        handleNavigation,
    };
}; 