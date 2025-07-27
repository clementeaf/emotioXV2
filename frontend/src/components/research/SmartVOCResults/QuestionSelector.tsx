'use client';


import React, { useState } from 'react';
import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';
import { QuestionResults } from './QuestionResults';

interface QuestionSelectorProps {
  questions: SmartVOCQuestion[];
  smartVOCData: any;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({ questions, smartVOCData }) => {
  const [selectedQuestion, setSelectedQuestion] = useState<SmartVOCQuestion | null>(null);

  // Filtrar preguntas que tienen datos disponibles
  const availableQuestions = questions.filter(question => {
    // Verificar si hay datos para esta pregunta específica
    switch (question.type) {
      case QuestionType.SMARTVOC_NPS:
        return smartVOCData?.npsScores?.length > 0 || smartVOCData?.monthlyNPSData?.length > 0;
      case QuestionType.SMARTVOC_VOC:
        return smartVOCData?.vocResponses?.length > 0;
      case QuestionType.SMARTVOC_CSAT:
        return smartVOCData?.csatScores?.length > 0;
      case QuestionType.SMARTVOC_CES:
        return smartVOCData?.cesScores?.length > 0;
      case QuestionType.SMARTVOC_CV:
        return smartVOCData?.cvScores?.length > 0;
      case QuestionType.SMARTVOC_NEV:
        return smartVOCData?.nevScores?.length > 0;
      default:
        return true; // Mostrar todas las preguntas por defecto
    }
  });

  // Eliminar duplicados basados en el tipo de pregunta
  const uniqueQuestions = availableQuestions.filter((question, index, self) =>
    index === self.findIndex(q => q.type === question.type)
  );

  // Función para obtener el título legible de la pregunta
  const getQuestionTitle = (question: SmartVOCQuestion): string => {
    if (question.title && question.title.trim()) {
      return question.title;
    }

    // Fallback basado en el tipo
    switch (question.type) {
      case QuestionType.SMARTVOC_NPS:
        return 'Net Promoter Score (NPS)';
      case QuestionType.SMARTVOC_VOC:
        return 'Voice of Customer (VOC)';
      case QuestionType.SMARTVOC_CSAT:
        return 'Customer Satisfaction (CSAT)';
      case QuestionType.SMARTVOC_CES:
        return 'Customer Effort Score (CES)';
      case QuestionType.SMARTVOC_CV:
        return 'Customer Value (CV)';
      case QuestionType.SMARTVOC_NEV:
        return 'Net Emotional Value (NEV)';
      default:
        return `Pregunta ${question.id}`;
    }
  };

  // Función para obtener el tipo de pregunta legible
  const getQuestionType = (type: string): string => {
    switch (type) {
      case QuestionType.SMARTVOC_NPS:
        return 'Linear Scale question';
      case QuestionType.SMARTVOC_VOC:
        return 'Text question';
      case QuestionType.SMARTVOC_CSAT:
        return 'Stars question';
      case QuestionType.SMARTVOC_CES:
        return 'Linear Scale question';
      case QuestionType.SMARTVOC_CV:
        return 'Linear Scale question';
      case QuestionType.SMARTVOC_NEV:
        return 'Linear Scale question';
      default:
        return 'Question';
    }
  };

  // Función para obtener datos específicos de la pregunta
  const getQuestionData = (question: SmartVOCQuestion) => {
    switch (question.type) {
      case QuestionType.SMARTVOC_NPS:
        const npsScores = smartVOCData?.npsScores || [];
        const maxNpsScore = npsScores.length > 0 ? Math.max(...npsScores) : 10;
        const isScale0to6 = maxNpsScore <= 6;

        let promoters, detractors, neutrals;

        if (isScale0to6) {
          // Escala 0-6: 0-2 detractores, 3 neutral, 4-6 promotores
          promoters = npsScores.filter((score: number) => score >= 4).length;
          detractors = npsScores.filter((score: number) => score <= 2).length;
          neutrals = npsScores.filter((score: number) => score === 3).length;
        } else {
          // Escala 0-10: 0-6 detractores, 7-8 neutral, 9-10 promotores
          promoters = npsScores.filter((score: number) => score >= 9).length;
          detractors = npsScores.filter((score: number) => score <= 6).length;
          neutrals = npsScores.filter((score: number) => score >= 7 && score <= 8).length;
        }
        const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : 0;

        return {
          responses: { count: npsScores.length, timeAgo: '26s' },
          score: npsScore,
          distribution: [
            { label: 'Promoters', percentage: promoters, color: '#10B981' },
            { label: 'Neutrals', percentage: neutrals, color: '#F59E0B' },
            { label: 'Detractors', percentage: detractors, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyNPSData || [],
          loyaltyEvolution: {
            promoters,
            promotersTrend: 'up' as const,
            detractors,
            detractorsTrend: 'down' as const,
            neutrals,
            neutralsTrend: 'down' as const,
            changePercentage: 10
          }
        };

      case QuestionType.SMARTVOC_CSAT:
        const csatScores = smartVOCData?.csatScores || [];
        const satisfied = Math.round(csatScores.length * 0.7);
        const neutralCSAT = Math.round(csatScores.length * 0.2);
        const dissatisfied = Math.round(csatScores.length * 0.1);
        const averageCSAT = csatScores.length > 0 ? Math.round((csatScores.reduce((a: number, b: number) => a + b, 0) / csatScores.length) * 10) / 10 : 0;

        return {
          responses: { count: csatScores.length, timeAgo: '26s' },
          score: averageCSAT,
          distribution: [
            { label: 'Satisfied', percentage: satisfied, color: '#10B981' },
            { label: 'Neutral', percentage: neutralCSAT, color: '#F59E0B' },
            { label: 'Dissatisfied', percentage: dissatisfied, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyCSATData || [],
          loyaltyEvolution: {
            promoters: satisfied,
            promotersTrend: 'up' as const,
            detractors: dissatisfied,
            detractorsTrend: 'down' as const,
            neutrals: neutralCSAT,
            neutralsTrend: 'down' as const,
            changePercentage: 12
          }
        };

      case QuestionType.SMARTVOC_CES:
        const cesScores = smartVOCData?.cesScores || [];
        const easy = Math.round(cesScores.length * 0.6);
        const neutralCES = Math.round(cesScores.length * 0.3);
        const difficult = Math.round(cesScores.length * 0.1);
        const averageCES = cesScores.length > 0 ? Math.round((cesScores.reduce((a: number, b: number) => a + b, 0) / cesScores.length) * 10) / 10 : 0;

        return {
          responses: { count: cesScores.length, timeAgo: '26s' },
          score: averageCES,
          distribution: [
            { label: 'Easy', percentage: easy, color: '#10B981' },
            { label: 'Neutral', percentage: neutralCES, color: '#F59E0B' },
            { label: 'Difficult', percentage: difficult, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyCESData || [],
          loyaltyEvolution: {
            promoters: easy,
            promotersTrend: 'up' as const,
            detractors: difficult,
            detractorsTrend: 'down' as const,
            neutrals: neutralCES,
            neutralsTrend: 'down' as const,
            changePercentage: 8
          }
        };

      case QuestionType.SMARTVOC_CV:
        const cvScores = smartVOCData?.cvScores || [];
        const maxCvScore = cvScores.length > 0 ? Math.max(...cvScores) : 5;
        let cvPositive, cvNegative, cvNeutral;

        if (maxCvScore <= 5) {
          // Escala 1-5: 1-2 negativo, 3 neutral, 4-5 positivo
          cvPositive = cvScores.filter((score: number) => score >= 4).length;
          cvNegative = cvScores.filter((score: number) => score <= 2).length;
          cvNeutral = cvScores.filter((score: number) => score === 3).length;
        } else if (maxCvScore <= 7) {
          // Escala 1-7: 1-3 negativo, 4 neutral, 5-7 positivo
          cvPositive = cvScores.filter((score: number) => score >= 5).length;
          cvNegative = cvScores.filter((score: number) => score <= 3).length;
          cvNeutral = cvScores.filter((score: number) => score === 4).length;
        } else {
          // Escala 1-10: 1-4 negativo, 5-6 neutral, 7-10 positivo
          cvPositive = cvScores.filter((score: number) => score >= 7).length;
          cvNegative = cvScores.filter((score: number) => score <= 4).length;
          cvNeutral = cvScores.filter((score: number) => score >= 5 && score <= 6).length;
        }
        const cvScore = cvScores.length > 0 ? Math.round(((cvPositive - cvNegative) / cvScores.length) * 100) : 0;

        return {
          responses: { count: cvScores.length, timeAgo: '26s' },
          score: cvScore,
          distribution: [
            { label: 'Positivo', percentage: cvPositive, color: '#10B981' },
            { label: 'Neutral', percentage: cvNeutral, color: '#F59E0B' },
            { label: 'Negativo', percentage: cvNegative, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyCVData || [],
          loyaltyEvolution: {
            promoters: cvPositive,
            promotersTrend: 'up' as const,
            detractors: cvNegative,
            detractorsTrend: 'down' as const,
            neutrals: cvNeutral,
            neutralsTrend: 'down' as const,
            changePercentage: 14
          }
        };

      case QuestionType.SMARTVOC_NEV:
        const nevScores = smartVOCData?.nevScores || [];
        const positive = Math.round(nevScores.length * 0.7);
        const neutralNEV = Math.round(nevScores.length * 0.2);
        const negative = Math.round(nevScores.length * 0.1);
        const averageNEV = nevScores.length > 0 ? Math.round((nevScores.reduce((a: number, b: number) => a + b, 0) / nevScores.length) * 10) / 10 : 0;

        return {
          responses: { count: nevScores.length, timeAgo: '26s' },
          score: averageNEV,
          distribution: [
            { label: 'Positive', percentage: positive, color: '#10B981' },
            { label: 'Neutral', percentage: neutralNEV, color: '#F59E0B' },
            { label: 'Negative', percentage: negative, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyNEVData || [],
          loyaltyEvolution: {
            promoters: positive,
            promotersTrend: 'up' as const,
            detractors: negative,
            detractorsTrend: 'down' as const,
            neutrals: neutralNEV,
            neutralsTrend: 'down' as const,
            changePercentage: 11
          }
        };

      case QuestionType.SMARTVOC_VOC:
        const vocResponses = smartVOCData?.vocResponses || [];
        const positiveResponses = Math.round(vocResponses.length * 0.6);
        const neutralVOC = Math.round(vocResponses.length * 0.3);
        const negativeResponses = Math.round(vocResponses.length * 0.1);

        return {
          responses: { count: vocResponses.length, timeAgo: '26s' },
          score: vocResponses.length,
          distribution: [
            { label: 'Positive', percentage: positiveResponses, color: '#10B981' },
            { label: 'Neutral', percentage: neutralVOC, color: '#F59E0B' },
            { label: 'Negative', percentage: negativeResponses, color: '#EF4444' }
          ],
          monthlyData: smartVOCData?.monthlyVOCData || [],
          loyaltyEvolution: {
            promoters: positiveResponses,
            promotersTrend: 'up' as const,
            detractors: negativeResponses,
            detractorsTrend: 'down' as const,
            neutrals: neutralVOC,
            neutralsTrend: 'down' as const,
            changePercentage: 10
          }
        };

      default:
        return {
          responses: { count: 0, timeAgo: '26s' },
          score: 0,
          distribution: [],
          monthlyData: [],
          loyaltyEvolution: {
            promoters: 0,
            promotersTrend: 'up' as const,
            detractors: 0,
            detractorsTrend: 'down' as const,
            neutrals: 0,
            neutralsTrend: 'down' as const,
            changePercentage: 0
          }
        };
    }
  };

  // Seleccionar la primera pregunta por defecto si no hay ninguna seleccionada
  React.useEffect(() => {
    if (!selectedQuestion && uniqueQuestions.length > 0) {
      setSelectedQuestion(uniqueQuestions[0]);
    }
  }, [uniqueQuestions, selectedQuestion]);

  if (uniqueQuestions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No hay preguntas SmartVOC disponibles con datos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Selector de preguntas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleccionar Pregunta SmartVOC</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueQuestions.map((question) => (
            <button
              key={question.id}
              onClick={() => setSelectedQuestion(question)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${selectedQuestion?.id === question.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="font-medium text-sm">{getQuestionTitle(question)}</div>
              <div className="text-xs text-gray-500 mt-1">{getQuestionType(question.type)}</div>
              <div className="text-xs text-gray-400 mt-1">ID: {question.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Componente de resultados de la pregunta seleccionada */}
      {selectedQuestion && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <QuestionResults
            questionNumber={`${uniqueQuestions.findIndex(q => q.id === selectedQuestion.id) + 1}`}
            title={getQuestionTitle(selectedQuestion)}
            type={getQuestionType(selectedQuestion.type)}
            conditionality="Conditionality disabled"
            required={true}
            question={selectedQuestion.description || getQuestionTitle(selectedQuestion)}
            {...getQuestionData(selectedQuestion)}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionSelector;
