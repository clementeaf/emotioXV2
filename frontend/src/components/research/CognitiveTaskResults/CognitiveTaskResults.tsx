'use client';

import { useCognitiveTaskResults } from '@/hooks/useCognitiveTaskResults';
import { useParams } from 'next/navigation';
import React from 'react';
import {
  CognitiveTaskHeader,
  DebugInfo,
  EmptyState,
  ErrorState,
  LoadingState,
  NavigationTestResults,
  QuestionContainer
} from './components';

interface CognitiveTaskResultsProps {
  researchId?: string;
}

export const CognitiveTaskResults: React.FC<CognitiveTaskResultsProps> = ({ researchId: propResearchId }) => {
  const params = useParams();
  const researchId = propResearchId || params?.research as string || params?.id as string;

  console.log('[CognitiveTaskResults] 🔍 Params:', params);
  console.log('[CognitiveTaskResults] 🎯 Research ID:', researchId);

  const {
    loadingState,
    error,
    participantResponses,
    processedData,
    refetch,
    isLoading,
    isError,
    isSuccess,
    hasData
  } = useCognitiveTaskResults(researchId);

  const handleFilter = () => {
    // console.log('Filtrar resultados');
  };

  const handleUpdate = () => {
    refetch();
  };

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <DebugInfo
          loadingState={loadingState}
          error={error}
          participantCount={participantResponses.length}
          processedDataCount={processedData.length}
          researchId={researchId}
        />
        <LoadingState message="Cargando resultados de tareas cognitivas..." />
      </div>
    );
  }

  // Mostrar error
  if (isError && error) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <DebugInfo
          loadingState={loadingState}
          error={error}
          participantCount={participantResponses.length}
          processedDataCount={processedData.length}
          researchId={researchId}
        />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  // Mostrar estado vacío
  if (isSuccess && !hasData) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <DebugInfo
          loadingState={loadingState}
          error={error}
          participantCount={participantResponses.length}
          processedDataCount={processedData.length}
          researchId={researchId}
        />
        <EmptyState
          title="No hay datos de tareas cognitivas"
          message="Aún no se han registrado respuestas para las tareas cognitivas de esta investigación."
          actionText="Recargar datos"
          onAction={refetch}
        />
      </div>
    );
  }

  // Renderizar datos si existen
  if (isSuccess && hasData) {
    return (
      <div className="space-y-6">
        <CognitiveTaskHeader title="2.0.- Cognitive task" />
        <DebugInfo
          loadingState={loadingState}
          error={error}
          participantCount={participantResponses.length}
          processedDataCount={processedData.length}
          researchId={researchId}
        />

        {processedData.map((questionData) => {
          console.log('[CognitiveTaskResults] 📊 Procesando pregunta:', questionData);

          // Determinar el tipo de vista basado en el tipo de pregunta
          let viewType: any = 'sentiment';
          let dataProps: any = {};

          switch (questionData.questionType) {
            case 'cognitive_long_text':
            case 'cognitive_short_text':
              viewType = 'sentiment';
              dataProps = {
                sentimentData: {
                  id: questionData.questionId,
                  questionNumber: questionData.questionId,
                  questionText: questionData.questionText,
                  questionType: questionData.questionType,
                  required: true,
                  conditionalityDisabled: false,
                  sentimentResults: questionData.sentimentData?.responses.map((resp, index) => ({
                    id: index.toString(),
                    text: resp.text,
                    sentiment: resp.sentiment
                  })) || [],
                  themes: questionData.sentimentData?.themes || [],
                  keywords: questionData.sentimentData?.keywords || [],
                  sentimentAnalysis: questionData.sentimentData?.analysis
                }
              };
              break;

            case 'cognitive_multiple_choice':
            case 'cognitive_single_choice':
              viewType = 'choice';
              dataProps = {
                choiceData: questionData.choiceData
              };
              break;

            case 'cognitive_ranking':
              viewType = 'ranking';
              dataProps = {
                rankingData: questionData.rankingData
              };
              break;

            case 'cognitive_linear_scale':
              viewType = 'linear_scale';
              dataProps = {
                linearScaleData: questionData.linearScaleData
              };
              break;

            case 'cognitive_preference_test':
              viewType = 'preference';
              dataProps = {
                preferenceTestData: questionData.preferenceTestData
              };
              break;

            case 'cognitive_image_selection':
              viewType = 'image_selection';
              dataProps = {
                imageSelectionData: questionData.imageSelectionData
              };
              break;

            case 'cognitive_navigation_flow':
              viewType = 'navigation_flow';
              dataProps = {
                navigationFlowData: questionData.navigationFlowData
              };
              break;

            default:
              // Para tipos no implementados, mostrar un placeholder
              return (
                <div key={questionData.questionId} className="w-full bg-white rounded-lg border border-neutral-200 mb-6 p-6">
                  <div className="text-center text-gray-500">
                    <p>Tipo de pregunta no implementado: {questionData.questionType}</p>
                    <p>Pregunta: {questionData.questionText}</p>
                  </div>
                </div>
              );
          }

          return (
            <QuestionContainer
              key={questionData.questionId}
              questionId={questionData.questionId}
              questionType={questionData.questionType}
              conditionalityDisabled={false}
              required={true}
              hasNewData={false}
              viewType={viewType}
              onFilter={handleFilter}
              onUpdate={handleUpdate}
              {...dataProps}
            />
          );
        })}

        {/* Navigation Test - Siempre mostrar si existe */}
        <NavigationTestResults
          questionId="3.7.-Navigation Test"
          questionType="Navigation Test"
          conditionalityDisabled={true}
          required={true}
        />
      </div>
    );
  }

  // Estado por defecto
  return (
    <div className="space-y-6">
      <CognitiveTaskHeader title="2.0.- Cognitive task" />
      <DebugInfo
        loadingState={loadingState}
        error={error}
        participantCount={participantResponses.length}
        processedDataCount={processedData.length}
        researchId={researchId}
      />
      <EmptyState
        title="Estado desconocido"
        message="No se pudo determinar el estado de los datos."
        actionText="Recargar"
        onAction={refetch}
      />
    </div>
  );
};
