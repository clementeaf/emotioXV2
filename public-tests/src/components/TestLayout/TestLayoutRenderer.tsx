import React from 'react';
import { useAvailableFormsQuery } from '../../hooks/useApiQueries';
import { useStepStore } from '../../stores/useStepStore';
import { useTestStore } from '../../stores/useTestStore';
import { ScreenComponent } from './StepsComponents';

const TestLayoutRenderer: React.FC = () => {
  const currentQuestionKey = useStepStore(state => state.currentQuestionKey);
  const { researchId } = useTestStore();

  // Consumir API de forms con researchId real
  const { data: formsData, isLoading, error } = useAvailableFormsQuery(researchId || '');

  if (isLoading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!currentQuestionKey) return <div>No se encontró información para este step</div>;

  // Buscar el step que haga match con currentQuestionKey
  const currentStepData = formsData?.stepsConfiguration?.find(
    (step: any) => step.questionKey === currentQuestionKey
  );

  if (!currentStepData) {
    return <div>No se encontró información para este step</div>;
  }

  // Extraer contentConfiguration
  const { contentConfiguration } = currentStepData;

  let renderedForm: React.ReactNode = null;

  if (currentQuestionKey === 'welcome_screen') {
    renderedForm = (
      <ScreenComponent
        data={{
          title: String(contentConfiguration?.title || 'Bienvenido'),
          description: String(contentConfiguration?.description || 'Gracias por participar en este estudio'),
          message: String(contentConfiguration?.message || 'Estás a punto de comenzar una experiencia única'),
          startButtonText: String(contentConfiguration?.startButtonText || 'Comenzar'),
          questionKey: currentQuestionKey
        }}
        onContinue={() => {}}
      />
    );
  } else {
    renderedForm = <div>No se encontró información para este step</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {renderedForm}
      </div>
    </div>
  );
};

export default TestLayoutRenderer;
