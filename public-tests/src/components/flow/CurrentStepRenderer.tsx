import React from 'react';
import { ParticipantFlowStep } from '../../types/flow'; // Importar el enum
import { Participant } from '../../../../shared/interfaces/participant'; // Importar interfaz Participant

// Importar los componentes de cada paso
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import SmartVOCHandler from './SmartVOCHandler';
import CognitiveTaskHandler from './CognitiveTaskHandler';

// Props que necesita este componente para funcionar
interface CurrentStepRendererProps {
    currentStep: ParticipantFlowStep;
    researchId: string;
    token: string | null;
    // Callbacks que vienen del padre (ParticipantFlow)
    onLoginSuccess: (participant: Participant) => void;
    onStepComplete: () => void;
    onError: (errorMessage: string, step: ParticipantFlowStep) => void;
}

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    currentStep,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {
    // La lógica principal es el switch que teníamos en ParticipantFlow
    console.log('[CurrentStepRenderer] Renderizando para el paso:', ParticipantFlowStep[currentStep]);

    switch (currentStep) {
        case ParticipantFlowStep.LOGIN:
            // No necesita token
            return <ParticipantLogin researchId={researchId} onLogin={onLoginSuccess} />;
        
        case ParticipantFlowStep.WELCOME:
            if (!token) {
                // Llamar a onError directamente aquí tiene más sentido que devolver null
                onError("Token no disponible para Welcome.", ParticipantFlowStep.WELCOME);
                // Podríamos devolver un mensaje de error o null, 
                // pero ParticipantFlow ya maneja el estado ERROR general.
                // Devolver null es más limpio si ParticipantFlow muestra un error global.
                return <div className="p-4 text-center text-orange-600">Esperando token para Bienvenida...</div>; // O null
            }
            return <WelcomeScreenHandler researchId={researchId} token={token} onComplete={onStepComplete} onError={(msg) => onError(msg, ParticipantFlowStep.WELCOME)} />;
        
        case ParticipantFlowStep.SMART_VOC:
            if (!token) {
                onError("Token no disponible para SmartVOC.", ParticipantFlowStep.SMART_VOC);
                return <div className="p-4 text-center text-orange-600">Esperando token para Feedback...</div>; // O null
            }
            return <SmartVOCHandler researchId={researchId} token={token} onComplete={onStepComplete} onError={(msg) => onError(msg, ParticipantFlowStep.SMART_VOC)} />;
        
        case ParticipantFlowStep.COGNITIVE_TASK:
            if (!token) {
                onError("Token no disponible para Cognitive Task.", ParticipantFlowStep.COGNITIVE_TASK);
                 return <div className="p-4 text-center text-orange-600">Esperando token para Tarea Cognitiva...</div>; // O null
            }
            return <CognitiveTaskHandler researchId={researchId} token={token} onComplete={onStepComplete} onError={(msg) => onError(msg, ParticipantFlowStep.COGNITIVE_TASK)} />;
        
        case ParticipantFlowStep.DONE:
            return (
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-semibold mb-4">¡Gracias por participar!</h2>
                    <p>Tu sesión ha finalizado.</p>
                </div>
            );

        // LOADING_SESSION y ERROR son manejados por el componente padre (ParticipantFlow)
        // No deberían llegar aquí si la lógica del padre es correcta.
        case ParticipantFlowStep.LOADING_SESSION:
             console.warn('[CurrentStepRenderer] Recibió estado inesperado: LOADING_SESSION');
            return <div className="p-6 text-center">Cargando... (inesperado)</div>; 
        case ParticipantFlowStep.ERROR:
            console.warn('[CurrentStepRenderer] Recibió estado inesperado: ERROR');
            // El padre ya muestra el error, aquí no mostramos nada o un mensaje genérico
            return null; 
        
        default:
            console.warn('[CurrentStepRenderer] Estado no manejado en switch:', currentStep);
             // Intentar obtener el nombre del enum por si acaso
            const stepName = ParticipantFlowStep[currentStep] || 'desconocido';
            return <div className="p-6 text-center text-red-500">Error: Estado del flujo no reconocido ({stepName}).</div>;
    }
};

export default CurrentStepRenderer; 