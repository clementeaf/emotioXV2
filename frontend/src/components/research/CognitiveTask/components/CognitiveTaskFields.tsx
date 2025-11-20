import { Info } from 'lucide-react';
import React, { useState } from 'react';
import type { UICognitiveQuestion } from '../types';

import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';

import type { ValidationErrors } from '../types';

import { QuestionCard } from './QuestionCard';

// Componente Tooltip personalizado
interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

const Tooltip = ({ content, children }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 p-2 text-sm bg-white text-gray-800 rounded-md shadow-lg max-w-xs top-0 left-full ml-2">
          {content}
          <div className="absolute top-2 -left-1 w-2 h-2 rotate-45 bg-white"></div>
        </div>
      )}
    </div>
  );
};

// Definición de props explícita para evitar problemas de tipos
type Props = {
  questions: UICognitiveQuestion[];
  randomizeQuestions: boolean;
  onQuestionChange: (questionId: string, updates: Partial<UICognitiveQuestion>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onFileDelete: (questionId: string, fileId: string) => void;
  setRandomizeQuestions: (checked: boolean) => void;
  onAddQuestion: (type: UICognitiveQuestion['type']) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  FileItemComponent?: React.ComponentType<any>;
  FileUploaderComponent?: React.ComponentType<any>;
  validationErrors: ValidationErrors | null;
};

export const CognitiveTaskFields: React.FC<Props> = ({
  questions,
  randomizeQuestions,
  onQuestionChange,
  onAddChoice,
  onRemoveChoice,
  onFileUpload,
  onFileDelete,
  setRandomizeQuestions,
  onAddQuestion,
  disabled = false,
  isUploading,
  uploadProgress,
  validationErrors,
}) => {
  // LOG INICIAL AL RECIBIR PROPS
  //   JSON.stringify(questions?.map(q => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [], null, 2)
  // );

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
      <div>
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 rounded-lg">
              <p className="font-semibold">No hay preguntas configuradas</p>
              <p>Añade preguntas para configurar tu tarea cognitiva.</p>
            </div>
          ) : (
            questions.map((question) => {
              // Normalizar type para la UI (solo para el componente, no para el backend)
              const normalizedType = typeof question.type === 'string' && question.type.startsWith('cognitive_')
                ? question.type.replace('cognitive_', '')
                : question.type;
              const questionForUI: UICognitiveQuestion = { ...question, type: normalizedType };

              // <<< Código original descomentado >>>
              const questionErrors: ValidationErrors = {};
              if (validationErrors) {
                Object.keys(validationErrors).forEach(key => {
                  if (key.startsWith(`${question.id}.`)) {
                    const fieldName = key.substring(question.id.length + 1);
                    questionErrors[fieldName] = validationErrors[key];
                  }
                });
              }

              return (
                <QuestionCard
                  key={question.id}
                  question={questionForUI as any}
                  onQuestionChange={onQuestionChange}
                  onAddChoice={onAddChoice}
                  onRemoveChoice={onRemoveChoice}
                  onFileUpload={onFileUpload}
                  onFileDelete={onFileDelete}
                  disabled={disabled}
                  validationErrors={questionErrors}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
