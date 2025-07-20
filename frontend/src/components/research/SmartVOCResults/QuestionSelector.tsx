'use client';


import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

import { QuestionResults } from './QuestionResults';

interface QuestionSelectorProps {
  researchId: string;
  questions: SmartVOCQuestion[];
  smartVOCData: any;
  className?: string;
}

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
    case QuestionType.SMARTVOC_NC:
      return 'Net Comments (NC)';
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
    case QuestionType.SMARTVOC_NC:
      return 'Comments question';
    default:
      return 'Question';
  }
};

// Función para obtener datos de respuestas según el tipo de pregunta
const getQuestionData = (question: SmartVOCQuestion, smartVOCData: any) => {
  switch (question.type) {
    case QuestionType.SMARTVOC_NPS:
      const npsScores = smartVOCData?.npsScores || [];
      const totalNPS = npsScores.length;
      const promoters = npsScores.filter((score: number) => score >= 9).length;
      const detractors = npsScores.filter((score: number) => score <= 6).length;
      const neutrals = npsScores.filter((score: number) => score > 6 && score < 9).length;
      const npsScore = totalNPS > 0 ? Math.round(((promoters - detractors) / totalNPS) * 100) : 0;

      return {
        responses: { count: totalNPS, timeAgo: '26s' },
        score: npsScore,
        distribution: [
          { label: 'Promoters', percentage: promoters, color: '#10B981' },
          { label: 'Detractors', percentage: detractors, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyNPSData || [],
        loyaltyEvolution: {
          promoters: promoters,
          promotersTrend: 'up' as const,
          detractors: detractors,
          detractorsTrend: 'down' as const,
          neutrals: neutrals,
          neutralsTrend: 'down' as const,
          changePercentage: 16
        }
      };

    case QuestionType.SMARTVOC_CSAT:
      const csatScores = smartVOCData?.csatScores || [];
      const totalCSAT = csatScores.length;
      const averageCSAT = totalCSAT > 0 ? Math.round((csatScores.reduce((a: number, b: number) => a + b, 0) / totalCSAT) * 10) / 10 : 0;
      const satisfied = csatScores.filter((score: number) => score >= 4).length;
      const dissatisfied = csatScores.filter((score: number) => score <= 2).length;
      const neutral = csatScores.filter((score: number) => score === 3).length;

      return {
        responses: { count: totalCSAT, timeAgo: '26s' },
        score: averageCSAT,
        distribution: [
          { label: 'Satisfied', percentage: satisfied, color: '#10B981' },
          { label: 'Neutral', percentage: neutral, color: '#F59E0B' },
          { label: 'Dissatisfied', percentage: dissatisfied, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyCSATData || [],
        loyaltyEvolution: {
          promoters: satisfied,
          promotersTrend: 'up' as const,
          detractors: dissatisfied,
          detractorsTrend: 'down' as const,
          neutrals: neutral,
          neutralsTrend: 'down' as const,
          changePercentage: 12
        }
      };

    case QuestionType.SMARTVOC_CES:
      const cesScores = smartVOCData?.cesScores || [];
      const totalCES = cesScores.length;
      const averageCES = totalCES > 0 ? Math.round((cesScores.reduce((a: number, b: number) => a + b, 0) / totalCES) * 10) / 10 : 0;
      const lowEffort = cesScores.filter((score: number) => score <= 3).length;
      const highEffort = cesScores.filter((score: number) => score >= 5).length;
      const mediumEffort = cesScores.filter((score: number) => score === 4).length;

      return {
        responses: { count: totalCES, timeAgo: '26s' },
        score: averageCES,
        distribution: [
          { label: 'Low Effort', percentage: lowEffort, color: '#10B981' },
          { label: 'Medium Effort', percentage: mediumEffort, color: '#F59E0B' },
          { label: 'High Effort', percentage: highEffort, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyCESData || [],
        loyaltyEvolution: {
          promoters: lowEffort,
          promotersTrend: 'up' as const,
          detractors: highEffort,
          detractorsTrend: 'down' as const,
          neutrals: mediumEffort,
          neutralsTrend: 'down' as const,
          changePercentage: 8
        }
      };

    case QuestionType.SMARTVOC_CV:
      const cvScores = smartVOCData?.cvScores || [];
      const totalCV = cvScores.length;
      const averageCV = totalCV > 0 ? Math.round((cvScores.reduce((a: number, b: number) => a + b, 0) / totalCV) * 10) / 10 : 0;
      const highValue = cvScores.filter((score: number) => score >= 5).length;
      const lowValue = cvScores.filter((score: number) => score <= 3).length;
      const mediumValue = cvScores.filter((score: number) => score === 4).length;

      return {
        responses: { count: totalCV, timeAgo: '26s' },
        score: averageCV,
        distribution: [
          { label: 'High Value', percentage: highValue, color: '#10B981' },
          { label: 'Medium Value', percentage: mediumValue, color: '#F59E0B' },
          { label: 'Low Value', percentage: lowValue, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyCVData || [],
        loyaltyEvolution: {
          promoters: highValue,
          promotersTrend: 'up' as const,
          detractors: lowValue,
          detractorsTrend: 'down' as const,
          neutrals: mediumValue,
          neutralsTrend: 'down' as const,
          changePercentage: 14
        }
      };

    case QuestionType.SMARTVOC_NEV:
      const nevScores = smartVOCData?.nevScores || [];
      const totalNEV = nevScores.length;
      const averageNEV = totalNEV > 0 ? Math.round((nevScores.reduce((a: number, b: number) => a + b, 0) / totalNEV) * 10) / 10 : 0;
      const highEmotional = nevScores.filter((score: number) => score >= 5).length;
      const lowEmotional = nevScores.filter((score: number) => score <= 3).length;
      const mediumEmotional = nevScores.filter((score: number) => score === 4).length;

      return {
        responses: { count: totalNEV, timeAgo: '26s' },
        score: averageNEV,
        distribution: [
          { label: 'High Emotional Value', percentage: highEmotional, color: '#10B981' },
          { label: 'Medium Emotional Value', percentage: mediumEmotional, color: '#F59E0B' },
          { label: 'Low Emotional Value', percentage: lowEmotional, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyNEVData || [],
        loyaltyEvolution: {
          promoters: highEmotional,
          promotersTrend: 'up' as const,
          detractors: lowEmotional,
          detractorsTrend: 'down' as const,
          neutrals: mediumEmotional,
          neutralsTrend: 'down' as const,
          changePercentage: 18
        }
      };

    case QuestionType.SMARTVOC_VOC:
      const vocResponses = smartVOCData?.vocResponses || [];
      const positiveResponses = Math.round(vocResponses.length * 0.6);
      const neutralResponses = Math.round(vocResponses.length * 0.3);
      const negativeResponses = Math.round(vocResponses.length * 0.1);

      return {
        responses: { count: vocResponses.length, timeAgo: '26s' },
        score: vocResponses.length,
        distribution: [
          { label: 'Positive', percentage: positiveResponses, color: '#10B981' },
          { label: 'Neutral', percentage: neutralResponses, color: '#F59E0B' },
          { label: 'Negative', percentage: negativeResponses, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyVOCData || [],
        loyaltyEvolution: {
          promoters: positiveResponses,
          promotersTrend: 'up' as const,
          detractors: negativeResponses,
          detractorsTrend: 'down' as const,
          neutrals: neutralResponses,
          neutralsTrend: 'down' as const,
          changePercentage: 10
        }
      };

    case QuestionType.SMARTVOC_NC:
      const ncResponses = smartVOCData?.ncResponses || [];
      const totalNC = ncResponses.length;
      const averageNC = totalNC > 0 ? Math.round((ncResponses.reduce((a: number, b: number) => a + b, 0) / totalNC) * 10) / 10 : 0;
      const positiveComments = Math.round(ncResponses.length * 0.7);
      const neutralComments = Math.round(ncResponses.length * 0.2);
      const negativeComments = Math.round(ncResponses.length * 0.1);

      return {
        responses: { count: totalNC, timeAgo: '26s' },
        score: averageNC,
        distribution: [
          { label: 'Positive Comments', percentage: positiveComments, color: '#10B981' },
          { label: 'Neutral Comments', percentage: neutralComments, color: '#F59E0B' },
          { label: 'Negative Comments', percentage: negativeComments, color: '#EF4444' }
        ],
        monthlyData: smartVOCData?.monthlyNCData || [],
        loyaltyEvolution: {
          promoters: positiveComments,
          promotersTrend: 'up' as const,
          detractors: negativeComments,
          detractorsTrend: 'down' as const,
          neutrals: neutralComments,
          neutralsTrend: 'down' as const,
          changePercentage: 15
        }
      };

    default:
      return {
        responses: { count: 0, timeAgo: '26s' },
        score: 0,
        distribution: []
      };
  }
};

export function QuestionSelector({
  researchId,
  questions,
  smartVOCData,
  className
}: QuestionSelectorProps) {
  // Debug: Log de datos recibidos
  console.log('[QuestionSelector] 🔍 Datos recibidos:', {
    researchId,
    questionsCount: questions?.length,
    smartVOCData,
    totalDataKeys: smartVOCData ? Object.keys(smartVOCData) : []
  });

  // Filtrar preguntas que tienen datos disponibles y evitar duplicados
  const availableQuestions = questions
    .filter(question => {
      // Debug: Log de cada pregunta
      console.log('[QuestionSelector] 🔍 Procesando pregunta:', {
        id: question.id,
        type: question.type,
        title: question.title,
        hasNPSData: smartVOCData?.npsScores?.length > 0,
        hasVOCData: smartVOCData?.vocResponses?.length > 0,
        hasCSATData: smartVOCData?.csatScores?.length > 0,
        hasCESData: smartVOCData?.cesScores?.length > 0,
        hasCVData: smartVOCData?.cvScores?.length > 0,
        hasNEVData: smartVOCData?.nevScores?.length > 0
      });

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
        case QuestionType.SMARTVOC_NC:
          return smartVOCData?.ncResponses?.length > 0;
        default:
          return true; // Mostrar todas las preguntas por defecto
      }
    })
    .filter((question, index, self) => {
      // Evitar duplicados basándose en el tipo de pregunta
      const firstIndex = self.findIndex(q => q.type === question.type);
      return firstIndex === index;
    });

  // Debug: Log de preguntas disponibles
  console.log('[QuestionSelector] 📊 Preguntas disponibles:', {
    totalQuestions: questions.length,
    availableQuestions: availableQuestions.length,
    availableQuestionTypes: availableQuestions.map(q => q.type)
  });

  if (availableQuestions.length === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <div className="text-center text-gray-500">
          <p>No hay preguntas disponibles para análisis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Renderizar QuestionResults para cada pregunta con datos */}
      {availableQuestions.map((question, index) => {
        const questionData = getQuestionData(question, smartVOCData);

        return (
          <QuestionResults
            key={question.id}
            questionNumber={`2.${index + 1}`}
            title={getQuestionTitle(question)}
            type={getQuestionType(question.type)}
            conditionality="Conditionality disabled"
            required={question.required || false}
            question={question.description || 'Pregunta SmartVOC'}
            responses={questionData.responses}
            score={questionData.score}
            distribution={questionData.distribution}
            monthlyData={questionData.monthlyData}
            loyaltyEvolution={questionData.loyaltyEvolution}
          />
        );
      })}
    </div>
  );
}
