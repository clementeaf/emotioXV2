import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useParticipantFlow } from '../hooks/useParticipantFlow';
import ErrorDisplay from './common/ErrorDisplay';
import LoadingIndicator from './common/LoadingIndicator';
import FlowStepContent from './flow/FlowStepContent';

const ParticipantFlow: React.FC = () => {
  const location = useLocation();
  const [researchId, setResearchId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const researchIdFromUrl = params.get('researchId');

    if (researchIdFromUrl) {
      console.log('[ParticipantFlow] ResearchId encontrado en URL:', researchIdFromUrl);
      setResearchId(researchIdFromUrl);
    } else {
      console.error('[ParticipantFlow] No se encontró researchId en la URL');
    }
  }, [location.search]);

  const flowHook = useParticipantFlow(researchId);

  const {
    currentStep,
    expandedSteps,
    currentStepIndex,
    isFlowLoading,
    error,
    token,
    handleLoginSuccess,
    handleStepComplete,
    handleError,
    responsesData,
    getStepResponse,
  } = flowHook;

  if (!researchId) {
    return (
      <ErrorDisplay
        title="Error de Acceso"
        message="No se encontró el ID de investigación en la URL. Asegúrate de acceder con un enlace válido."
      />
    );
  }

  // Obtener el paso actual expandido
  const currentExpandedStep = expandedSteps && expandedSteps.length > 0 && currentStepIndex >= 0 && currentStepIndex < expandedSteps.length
    ? expandedSteps[currentStepIndex]
    : null;

  // Obtener la respuesta guardada para el paso actual
  const savedResponse = currentExpandedStep ? getStepResponse(currentExpandedStep.id) : null;

  // Si está cargando inicialmente
  if (isFlowLoading && !currentExpandedStep) {
    return <LoadingIndicator message="Inicializando flujo de participante..." />;
  }

  return (
    <FlowStepContent
      currentStepEnum={currentStep}
      currentExpandedStep={currentExpandedStep}
      isLoading={isFlowLoading}
      researchId={researchId}
      token={token}
      error={error}
      handleLoginSuccess={handleLoginSuccess}
      handleStepComplete={handleStepComplete}
      handleError={handleError}
      responsesData={responsesData}
      savedResponse={savedResponse}
    />
  );
};

export default ParticipantFlow;
