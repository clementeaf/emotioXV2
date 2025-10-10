import { useState, useEffect, useCallback } from 'react';
import { useModuleResponsesQuery } from './useApiQueries';
import { useTestStore } from '../stores/useTestStore';
import { useFormDataStore } from '../stores/useFormDataStore';

interface UseDemographicDataProps {
  currentQuestionKey?: string;
}

export const useDemographicData = ({ currentQuestionKey = 'demographics' }: UseDemographicDataProps) => {
  const { researchId, participantId } = useTestStore();
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const { data: moduleResponses } = useModuleResponsesQuery(
    researchId || '',
    participantId || ''
  );

  const { setFormData } = useFormDataStore();

  const handleInputChange = useCallback((key: string, value: string) => {
    const newValues = {
      ...formValues,
      [key]: value
    };
    setFormValues(newValues);
    setFormData(currentQuestionKey, newValues);
  }, [formValues, currentQuestionKey, setFormData]);

  useEffect(() => {
    if (moduleResponses?.responses) {
      const demographicsResponse = moduleResponses.responses.find(
        (response) => response.questionKey === currentQuestionKey
      );

      if (demographicsResponse?.response && Object.keys(demographicsResponse.response).length > 0) {
        console.log('[useDemographicData] 🎯 Cargando datos del backend:', demographicsResponse.response);
        setFormValues(demographicsResponse.response as Record<string, string>);
        setHasLoadedData(true);
      } else {
        console.log('[useDemographicData] 🔍 Respuesta vacía o sin datos:', demographicsResponse?.response);
        setHasLoadedData(false);
      }
    }
  }, [moduleResponses, currentQuestionKey]);

  return {
    formValues,
    hasLoadedData,
    handleInputChange
  };
};
