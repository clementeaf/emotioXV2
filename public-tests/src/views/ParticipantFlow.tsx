import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useParticipantFlowWithStore } from '../hooks/useParticipantFlowWithStore';
import { ParticipantFlowStep } from '../types/flow';

// Componentes de ejemplo que se pueden ajustar según la estructura de la aplicación
import DemographicForm from '../components/DemographicForm';
import WelcomeScreen from '../components/WelcomeScreen';
import ThankYouScreen from '../components/ThankYouScreen';
import LoginForm from '../components/LoginForm';
import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';
import CognitiveTaskQuestion from '../components/CognitiveTaskQuestion';
import SmartVOCQuestion from '../components/SmartVOCQuestion';
import EyeTrackingTask from '../components/EyeTrackingTask';
import ProgressBar from '../components/ProgressBar';

const ParticipantFlow: React.FC = () => {
  const { researchId } = useParams<{ researchId: string }>();
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Usar el hook personalizado para manejar el flujo
  const {
    currentStep,
    error,
    expandedSteps,
    currentStepIndex,
    handleLoginSuccess,
    handleStepComplete,
    navigateToStep,
    completedRelevantSteps,
    totalRelevantSteps,
    responsesData,
    hasStepBeenAnswered,
    getAnsweredStepIndices
  } = useParticipantFlowWithStore(researchId);

  // Efecto para actualizar información de depuración
  useEffect(() => {
    const answeredSteps = getAnsweredStepIndices();
    setDebugInfo(JSON.stringify({
      currentStep: ParticipantFlowStep[currentStep],
      currentStepIndex,
      expandedStepsCount: expandedSteps.length,
      answeredStepsCount: answeredSteps.length,
      progress: `${completedRelevantSteps}/${totalRelevantSteps}`
    }, null, 2));
  }, [currentStep, currentStepIndex, expandedSteps, completedRelevantSteps, totalRelevantSteps, getAnsweredStepIndices]);

  // Renderizar el componente adecuado según el paso actual
  const renderCurrentStep = () => {
    if (currentStep === ParticipantFlowStep.LOADING_SESSION) {
      return <LoadingScreen message="Cargando sesión..." />;
    }
    
    if (currentStep === ParticipantFlowStep.ERROR) {
      return <ErrorScreen message={error || 'Ha ocurrido un error'} />;
    }
    
    if (currentStep === ParticipantFlowStep.LOGIN) {
      return <LoginForm onLoginSuccess={handleLoginSuccess} researchId={researchId} />;
    }
    
    if (currentStep === ParticipantFlowStep.DONE) {
      return <ThankYouScreen message="¡Gracias por completar la investigación!" />;
    }
    
    if (expandedSteps.length === 0 || currentStepIndex >= expandedSteps.length) {
      return <ErrorScreen message="Configuración de investigación inválida" />;
    }
    
    const currentStepInfo = expandedSteps[currentStepIndex];
    const isStepAnswered = hasStepBeenAnswered(currentStepIndex);
    
    // Renderizar basado en el tipo de paso
    switch (currentStepInfo.type) {
      case 'demographic':
        return (
          <DemographicForm
            config={currentStepInfo.config}
            onSubmit={handleStepComplete}
            isAnswered={isStepAnswered}
          />
        );
        
      case 'welcome':
        return (
          <WelcomeScreen
            title={currentStepInfo.config?.title || '¡Bienvenido!'}
            message={currentStepInfo.config?.message || 'Gracias por participar'}
            onContinue={() => handleStepComplete({})}
          />
        );
        
      case 'thankyou':
        return (
          <ThankYouScreen
            message={currentStepInfo.config?.message || '¡Gracias por completar la investigación!'}
          />
        );
      
      // NUEVO: Manejo de tipos de eye-tracking
      case 'eye_tracking_heatmap':
      case 'eye_tracking_gaze':
      case 'eye_tracking_fixation':
      case 'eye_tracking_saccade':
      case 'eye_tracking_general':
        return (
          <EyeTrackingTask
            question={currentStepInfo}
            onComplete={handleStepComplete}
            isAnswered={isStepAnswered}
          />
        );
      
      // Manejo de tipos de cognitive task
      case 'cognitive_open':
      case 'cognitive_closed':
      case 'cognitive_multiplechoice':
      case 'cognitive_text':
      case 'cognitive_image':
        return (
          <CognitiveTaskQuestion
            question={currentStepInfo}
            onComplete={handleStepComplete}
            isAnswered={isStepAnswered}
          />
        );
      
      // Manejo de tipos de SmartVOC
      case 'smartvoc_csat':
      case 'smartvoc_ces':
      case 'smartvoc_nps':
      case 'smartvoc_cv':
      case 'smartvoc_nev':
      case 'smartvoc_feedback':
        return (
          <SmartVOCQuestion
            question={currentStepInfo}
            onComplete={handleStepComplete}
            isAnswered={isStepAnswered}
          />
        );
      
      // Tipos genéricos y fallback
      default:
        console.warn(`Tipo de paso no reconocido: ${currentStepInfo.type}`);
        return (
          <div className="generic-question">
            <h2>{currentStepInfo.name}</h2>
            <p>Tipo: {currentStepInfo.type}</p>
            <p>ID: {currentStepInfo.id}</p>
            <button onClick={() => handleStepComplete({ default: 'response' })}>
              Continuar
            </button>
          </div>
        );
    }
  };
  
  // UI para navegación entre pasos (para desarrollo/testing)
  const renderStepsNavigation = () => {
    if (expandedSteps.length === 0 || ![ParticipantFlowStep.WELCOME, ParticipantFlowStep.QUESTION].includes(currentStep)) {
      return null;
    }
    
    const answeredStepIndices = getAnsweredStepIndices();
    
    return (
      <div className="steps-navigation">
        <h3>Pasos de la investigación</h3>
        <div className="steps-list">
          {expandedSteps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => navigateToStep(index)}
              disabled={index > Math.max(...answeredStepIndices, 0) && !answeredStepIndices.includes(index)}
              className={`step-button ${index === currentStepIndex ? 'active' : ''} ${answeredStepIndices.includes(index) ? 'answered' : ''}`}
            >
              {step.name}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="participant-flow">
      {/* Barra de progreso */}
      {totalRelevantSteps > 0 && (
        <ProgressBar 
          current={completedRelevantSteps} 
          total={totalRelevantSteps} 
        />
      )}
      
      {/* Paso actual */}
      <div className="current-step-container">
        {renderCurrentStep()}
      </div>
      
      {/* Depuración: mostrar información de sesión */}
      <div className="debug-section" style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Información de sesión</h3>
        <pre>{debugInfo}</pre>
        
        <h4>Orden de módulos:</h4>
        <ol>
          {expandedSteps.map((step, index) => (
            <li key={index}>
              <strong>{step.name}</strong> ({step.type})
              {currentStepIndex === index && <span style={{ color: 'green' }}> ← Actual</span>}
            </li>
          ))}
        </ol>
      </div>
      
      {/* Navegación entre pasos */}
      {renderStepsNavigation()}
    </div>
  );
};

export default ParticipantFlow; 