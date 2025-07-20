'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from 'shared/interfaces/smart-voc.interface';

import { CESQuestion } from './CESQuestion';
import { CSATQuestion } from './CSATQuestion';
import { CVQuestion } from './CVQuestion';
import { NEVQuestion } from './NEVQuestion';
import { NPSQuestion } from './NPSQuestion';
import { VOCQuestion } from './VOCQuestion';

interface QuestionSelectorProps {
  researchId: string;
  questions: SmartVOCQuestion[];
  smartVOCData: any;
  className?: string;
}

interface QuestionAnalysisProps {
  question: SmartVOCQuestion;
  data: any;
  researchId: string;
}

// Adaptadores para componentes existentes
const NPSQuestionAdapter: React.ComponentType<QuestionAnalysisProps> = ({ data }) => {
  return <NPSQuestion monthlyData={data?.monthlyNPSData || []} />;
};

const VOCQuestionAdapter: React.ComponentType<QuestionAnalysisProps> = ({ data }) => {
  const comments = data?.vocResponses?.map((comment: any) => ({
    text: comment.text,
    mood: 'Positive', // Placeholder - se puede mejorar con análisis de sentimientos
    selected: false
  })) || [];

  return <VOCQuestion comments={comments} />;
};

// Mapeo de tipos de pregunta a componentes de análisis
const QUESTION_ANALYSIS_COMPONENTS: Record<string, React.ComponentType<QuestionAnalysisProps>> = {
  [QuestionType.SMARTVOC_NPS]: NPSQuestionAdapter,
  [QuestionType.SMARTVOC_VOC]: VOCQuestionAdapter,
  [QuestionType.SMARTVOC_CSAT]: CSATQuestion,
  [QuestionType.SMARTVOC_CES]: CESQuestion,
  [QuestionType.SMARTVOC_CV]: CVQuestion,
  [QuestionType.SMARTVOC_NEV]: NEVQuestion,
};

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

// Función para obtener el color del badge según el tipo
const getQuestionBadgeColor = (type: string): string => {
  switch (type) {
    case QuestionType.SMARTVOC_NPS:
      return 'bg-blue-100 text-blue-700';
    case QuestionType.SMARTVOC_VOC:
      return 'bg-green-100 text-green-700';
    case QuestionType.SMARTVOC_CSAT:
      return 'bg-purple-100 text-purple-700';
    case QuestionType.SMARTVOC_CES:
      return 'bg-orange-100 text-orange-700';
    case QuestionType.SMARTVOC_CV:
      return 'bg-indigo-100 text-indigo-700';
    case QuestionType.SMARTVOC_NEV:
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-gray-100 text-gray-700';
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
    cvScores: smartVOCData?.cvScores,
    cvScoresLength: smartVOCData?.cvScores?.length,
    totalDataKeys: smartVOCData ? Object.keys(smartVOCData) : []
  });

  const [selectedQuestion, setSelectedQuestion] = useState<SmartVOCQuestion | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Seleccionar la primera pregunta por defecto
  useEffect(() => {
    if (questions.length > 0 && !selectedQuestion) {
      setSelectedQuestion(questions[0]);
    }
  }, [questions, selectedQuestion]);

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

  const handleQuestionSelect = (question: SmartVOCQuestion) => {
    setSelectedQuestion(question);
    setIsExpanded(false);
  };

  const renderQuestionAnalysis = () => {
    if (!selectedQuestion) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Selecciona una pregunta para ver su análisis</p>
        </div>
      );
    }

    const AnalysisComponent = QUESTION_ANALYSIS_COMPONENTS[selectedQuestion.type];

    if (!AnalysisComponent) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Análisis no disponible para este tipo de pregunta</p>
        </div>
      );
    }

    return (
      <AnalysisComponent
        question={selectedQuestion}
        data={smartVOCData}
        researchId={researchId}
      />
    );
  };

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
      {/* Selector de preguntas */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Análisis de Preguntas SmartVOC
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Mostrar
              </>
            )}
          </Button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {availableQuestions.map((question) => (
              <button
                key={question.id}
                onClick={() => handleQuestionSelect(question)}
                className={cn(
                  'p-3 rounded-lg border text-left transition-all hover:shadow-md',
                  selectedQuestion?.id === question.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', getQuestionBadgeColor(question.type))}
                  >
                    {question.type.replace('smartvoc_', '').toUpperCase()}
                  </Badge>
                  {question.required && (
                    <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                      Requerida
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-sm text-gray-900 mb-1">
                  {getQuestionTitle(question)}
                </h4>
                {question.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {question.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Pregunta seleccionada actual */}
        {selectedQuestion && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge
              variant="secondary"
              className={cn('text-sm', getQuestionBadgeColor(selectedQuestion.type))}
            >
              {selectedQuestion.type.replace('smartvoc_', '').toUpperCase()}
            </Badge>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {getQuestionTitle(selectedQuestion)}
              </h4>
              {selectedQuestion.description && (
                <p className="text-sm text-gray-600">
                  {selectedQuestion.description}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Análisis de la pregunta seleccionada */}
      <div className="mt-6">
        {renderQuestionAnalysis()}
      </div>
    </div>
  );
}
