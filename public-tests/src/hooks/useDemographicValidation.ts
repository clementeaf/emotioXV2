import { useCallback } from 'react';

interface ValidationResult {
  isDisqualified: boolean;
  reason?: string;
  disqualifyingField?: string;
}

export interface DemographicQuestion {
  enabled?: boolean;
  disqualifyingAges?: string[];
  disqualifyingCountries?: string[];
  disqualifyingGenders?: string[];
  disqualifyingEducation?: string[];
  disqualifyingIncomes?: string[];
  disqualifyingEmploymentStatuses?: string[];
  disqualifyingHours?: string[];
  disqualifyingProficiencies?: string[];
}

export type DemographicQuestions = Record<string, DemographicQuestion>;

/**
 * Hook para validar respuestas demográficas contra criterios descalificatorios
 */
export const useDemographicValidation = () => {

  /**
   * Valida las respuestas demográficas contra los criterios descalificatorios
   */
  const validateDemographics = useCallback((
    responses: Record<string, string>,
    demographicQuestions: DemographicQuestions
  ): ValidationResult => {

    if (!demographicQuestions) {
      return { isDisqualified: false };
    }

    // Validar cada pregunta demográfica
    for (const [questionKey, question] of Object.entries(demographicQuestions)) {
      const questionData = question;
      if (!questionData?.enabled) continue;

      const response = responses[questionKey];
      if (!response) continue;

      // Validar según el tipo de pregunta
      switch (questionKey) {
        case 'age':
          if (questionData.disqualifyingAges?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Edad descalificatoria: ${response}`,
              disqualifyingField: 'age'
            };
          }
          break;

        case 'country':
          if (questionData.disqualifyingCountries?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `País descalificatorio: ${response}`,
              disqualifyingField: 'country'
            };
          }
          break;

        case 'gender':
          if (questionData.disqualifyingGenders?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Género descalificatorio: ${response}`,
              disqualifyingField: 'gender'
            };
          }
          break;

        case 'educationLevel':
          if (questionData.disqualifyingEducation?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Nivel educativo descalificatorio: ${response}`,
              disqualifyingField: 'educationLevel'
            };
          }
          break;

        case 'householdIncome':
          if (questionData.disqualifyingIncomes?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Ingreso familiar descalificatorio: ${response}`,
              disqualifyingField: 'householdIncome'
            };
          }
          break;

        case 'employmentStatus':
          if (questionData.disqualifyingEmploymentStatuses?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Estado laboral descalificatorio: ${response}`,
              disqualifyingField: 'employmentStatus'
            };
          }
          break;

        case 'dailyHoursOnline':
          if (questionData.disqualifyingHours?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Horas diarias en línea descalificatorias: ${response}`,
              disqualifyingField: 'dailyHoursOnline'
            };
          }
          break;

        case 'technicalProficiency':
          if (questionData.disqualifyingProficiencies?.includes(response)) {
            return {
              isDisqualified: true,
              reason: `Competencia técnica descalificatoria: ${response}`,
              disqualifyingField: 'technicalProficiency'
            };
          }
          break;
      }
    }

    // Si no se encontró ninguna descalificación
    return {
      isDisqualified: false
    };
  }, []);

  return {
    validateDemographics
  };
};
