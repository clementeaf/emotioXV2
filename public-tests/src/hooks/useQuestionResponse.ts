import { useEffect, useState } from 'react';
import { UseQuestionResponseProps, UseQuestionResponseReturn } from './types';

export const useQuestionResponse = ({
  currentStepKey,
  previousResponse,
  questionType
}: UseQuestionResponseProps): UseQuestionResponseReturn => {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [textValue, setTextValue] = useState<string>('');
  const [demographicsValues, setDemographicsValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (previousResponse) {
      console.log(`[useQuestionResponse] Procesando respuesta previa para ${currentStepKey}:`, previousResponse);

      // Manejar respuestas de tipo choice (single/multiple choice)
      if (questionType === 'choice') {
        const prevChoice = previousResponse.choice ||
                          previousResponse.selected ||
                          previousResponse.value ||
                          previousResponse.answer;

        if (typeof prevChoice === 'string') {
          setSelectedValue(prevChoice);
        } else if (Array.isArray(prevChoice) && prevChoice.length > 0) {
          // Para múltiples selecciones, tomar la primera
          setSelectedValue(String(prevChoice[0]));
        }
      }

      // Manejar respuestas de tipo text (VOCTextQuestion)
      if (questionType === 'text') {
        const prevText = previousResponse.text ||
                        previousResponse.value ||
                        previousResponse.answer ||
                        previousResponse.response;

        if (typeof prevText === 'string') {
          setTextValue(prevText);
        }
      }

      // Manejar respuestas de tipo scale (ScaleRangeQuestion)
      if (questionType === 'scale') {
        const prevScale = previousResponse.scale ||
                         previousResponse.value ||
                         previousResponse.answer ||
                         previousResponse.rating;

        if (typeof prevScale === 'number') {
          setSelectedValue(String(prevScale));
        } else if (typeof prevScale === 'string') {
          setSelectedValue(prevScale);
        }
      }

      // Manejar respuestas de tipo emoji (EmojiRangeQuestion)
      if (questionType === 'emoji') {
        const prevEmoji = previousResponse.emoji ||
                         previousResponse.value ||
                         previousResponse.answer ||
                         previousResponse.rating;

        if (typeof prevEmoji === 'string') {
          setSelectedValue(prevEmoji);
        } else if (typeof prevEmoji === 'number') {
          setSelectedValue(String(prevEmoji));
        }
      }

      // Manejar respuestas de demographics (formularios)
      if (currentStepKey === 'demographics') {
        console.log(`[useQuestionResponse] Procesando demographics para ${currentStepKey}:`, previousResponse);

        const demographicsData: Record<string, string> = {};

        // Para demographics, usar directamente los valores del formulario
        Object.entries(previousResponse).forEach(([key, value]) => {
          if (typeof value === 'string' && key !== 'submitted' && key !== 'timestamp' && key !== 'stepType' && key !== 'stepTitle') {
            console.log(`[useQuestionResponse] Campo demographics: ${key} = ${value}`);
            demographicsData[key] = value;
          }
        });

        console.log(`[useQuestionResponse] Valores demographics procesados:`, demographicsData);
        setDemographicsValues(demographicsData);
      }
    }
  }, [previousResponse, questionType, currentStepKey]);

  const hasPreviousResponse = !!previousResponse && (
    (questionType === 'choice' && !!selectedValue) ||
    (questionType === 'text' && !!textValue) ||
    (questionType === 'scale' && !!selectedValue) ||
    (questionType === 'emoji' && !!selectedValue) ||
    (currentStepKey === 'demographics' && Object.keys(demographicsValues).length > 0)
  );

  return {
    selectedValue,
    textValue,
    setSelectedValue,
    setTextValue,
    hasPreviousResponse,
    demographicsValues
  };
};
