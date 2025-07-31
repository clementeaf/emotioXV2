'use client';



interface QuestionInfoProps {
  questionId: string;
  questionText: string; // Agregar el título real de la pregunta
  questionType: string;
  conditionalityDisabled: boolean;
  required: boolean;
  hasNewData?: boolean;
}

export function QuestionInfo({
  questionId,
  questionText,
  questionType,
  conditionalityDisabled,
  required,
  hasNewData = false
}: QuestionInfoProps) {
  return (
    <div className="p-5 border-b border-neutral-200">
      <div className="flex items-center flex-wrap gap-4">
        <span className="font-medium text-neutral-800 mr-2">
          {questionText}
        </span>
        <div className="flex items-center gap-2 ml-2">
          {(questionId === '3.7' || questionId === '3.7-detail') && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Navigation Test</span>
          )}
          {questionType === 'short_text' && questionId !== '3.7' && questionId !== '3.7-detail' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Short Text question</span>
          )}
          {questionType === 'long_text' && questionId !== '3.7' && questionId !== '3.7-detail' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Long Text question</span>
          )}
          {questionType === 'multiple_choice' && questionId === '3.3' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Single Choice question</span>
          )}
          {questionType === 'multiple_choice' && questionId === '3.4' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Multiple Choice question</span>
          )}
          {(questionType === 'rating' || questionType === 'linear_scale') && questionId !== '3.7' && questionId !== '3.7-detail' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium">Linear Scale question</span>
          )}
          {conditionalityDisabled && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">Conditionally disabled</span>
          )}
          {required && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm font-medium">Required</span>
          )}
        </div>

      </div>
    </div>
  );
}
