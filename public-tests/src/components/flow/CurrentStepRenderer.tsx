import React from 'react';
import { ParticipantFlowStep } from '../../types/flow';
import { ParticipantLogin } from '../auth/ParticipantLogin';
import WelcomeScreenHandler from './WelcomeScreenHandler';
import SmartVOCHandler from './SmartVOCHandler';
import CognitiveTaskHandler from './CognitiveTaskHandler';
import { CurrentStepRendererProps } from './types';

const CurrentStepRenderer: React.FC<CurrentStepRendererProps> = ({
    currentStep,
    researchId,
    token,
    onLoginSuccess,
    onStepComplete,
    onError,
}) => {

    switch (currentStep) {
        case ParticipantFlowStep.LOGIN:
            return <ParticipantLogin researchId={researchId} onLogin={onLoginSuccess} />;
        
        case ParticipantFlowStep.WELCOME:
            if (!token) {
                onError("Token no disponible para Welcome.", ParticipantFlowStep.WELCOME);
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
        case ParticipantFlowStep.LOADING_SESSION:
             console.warn('[CurrentStepRenderer] Recibió estado inesperado: LOADING_SESSION');
            return <div className="p-6 text-center">Cargando... (inesperado)</div>; 
        case ParticipantFlowStep.ERROR:
            console.warn('[CurrentStepRenderer] Recibió estado inesperado: ERROR');
            return null; 
        
        default:
            console.warn('[CurrentStepRenderer] Estado no manejado en switch:', currentStep);
            const stepName = ParticipantFlowStep[currentStep] || 'desconocido';
            return <div className="p-6 text-center text-red-500">Error: Estado del flujo no reconocido ({stepName}).</div>;
    }
};

export default CurrentStepRenderer; 