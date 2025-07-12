import React, { useEffect, useState } from 'react';
import { useStepResponseManager } from '../../hooks/useStepResponseManager';
import type { ModuleResponse } from '../../stores/participantStore';
import { useParticipantStore } from '../../stores/participantStore';
import { MappedStepComponentProps } from '../../types/flow.types';
import type { CSATResponse } from '../../types/smart-voc.types';
import { formatQuestionText } from '../../utils/formHelpers';
import { generateSatisfactionLevels } from '../../utils/smartVocUtils';
import FormSubmitButton from '../common/FormSubmitButton';
import { SatisfactionButton } from './SatisfactionButton';
import { StarRating } from './StarRating';

interface SmartVOCScaleConfig {
  scaleRange: { start: number; end: number };
  startLabel: string;
  endLabel: string;
  type?: string;
  title?: string;
  description?: string;
  instructions?: string;
  companyName?: string;
}

interface CSATViewProps extends MappedStepComponentProps {}

const CSATView: React.FC<CSATViewProps> = (props) => {
  const { stepConfig, onStepComplete } = props;
  const question = stepConfig as { config: SmartVOCScaleConfig; [key: string]: any };

  if (!question || !question.config) {
    return <div>Cargando configuración...</div>;
  }

  const questionText = question.config?.title || question.config?.description || question.title || 'Valora tu satisfacción';
  const instructions = question.config?.instructions || question.instructions || '';
  const companyName = question.config?.companyName || '';
  const useStars = question.config?.type === 'stars';
  const satisfactionLevels = generateSatisfactionLevels(question.config);

  // Buscar la respuesta persistida directamente en el store Zustand
  const allSteps = useParticipantStore(state => state.responsesData.modules.all_steps || []);
  const moduleResponse = allSteps.find(r => r.questionKey === question.questionKey) || null;
  const extractSelectedRating = (resp: ModuleResponse | null | undefined): number | null => {
    if (resp && typeof resp === 'object' && resp.response && typeof resp.response === 'object' && 'value' in resp.response) {
      return (resp.response as CSATResponse).value;
    }
    return null;
  };
  const persistedRating = extractSelectedRating(moduleResponse);
  const [selectedRating, setSelectedRating] = useState<number | null>(persistedRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRating(persistedRating);
  }, [persistedRating, question.questionKey]);

  const { isSaving, saveCurrentStepResponse } = useStepResponseManager({
    stepId: question.id,
    stepType: 'csat',
    stepName: question.title || 'Valora tu satisfacción',
    researchId: undefined,
    participantId: undefined,
    questionKey: question.questionKey,
  });

  const handleRatingChange = (rating: number) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (selectedRating === null) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const responseData: CSATResponse = {
        value: selectedRating,
        questionKey: question.questionKey,
        timestamp: Date.now(),
        stepTitle: question.title || '',
        metadata: {
          questionType: question.type,
          questionId: question.id,
          companyName,
          useStars
        }
      };
      await saveCurrentStepResponse(responseData);
      onStepComplete?.(responseData);
    } catch (e) {
      setError('Error guardando la respuesta. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="max-w-md w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {formatQuestionText(questionText, companyName)}
          </h2>
          {instructions && (
            <p className="text-sm text-gray-600 mb-4">{instructions}</p>
          )}
        </div>

        <div className="mb-6">
          {useStars ? (
            <StarRating
              rating={selectedRating || 0}
              onRatingChange={handleRatingChange}
              maxRating={5}
              disabled={isSubmitting}
            />
          ) : (
            <div className="flex flex-row justify-between items-end gap-4 w-full">
              {satisfactionLevels.map((level) => (
                <SatisfactionButton
                  key={level.value}
                  value={level.value}
                  label={level.label}
                  selected={selectedRating === level.value}
                  onClick={isSubmitting ? () => {} : handleRatingChange}
                />
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className='w-full flex justify-center'>
          <FormSubmitButton
          isSaving={isSubmitting || isSaving}
          hasExistingData={!!(persistedRating !== null)}
          onClick={handleSubmit}
          disabled={selectedRating === null || isSubmitting}
          customCreateText="Guardar y continuar"
          customUpdateText="Actualizar y continuar"
        />
        </div>
      </div>
    </div>
  );
};

export default CSATView;
