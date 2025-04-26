import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Info } from 'lucide-react';
import type { Question, ValidationErrors } from '../types';

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
  questions: Question[];
  randomizeQuestions: boolean;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onFileDelete: (questionId: string, fileId: string) => void;
  setRandomizeQuestions: (checked: boolean) => void;
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
  disabled = false,
  isUploading,
  uploadProgress,
  validationErrors,
}) => {
  // LOG INICIAL AL RECIBIR PROPS
  console.log('[CognitiveTaskFields] Props RECIBIDAS - questions:', 
    JSON.stringify(questions?.map(q => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [], null, 2)
  );

  return (
    <div>
      <div className="mb-6">
        <Label className="mb-2 block text-sm font-medium">
          <div className="flex items-center gap-2">
            <span>Configuración</span>
            <Tooltip content="Opciones generales para configurar la tarea cognitiva">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Tooltip>
          </div>
        </Label>

        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="randomizeQuestions"
              checked={randomizeQuestions}
              onCheckedChange={(checked) => setRandomizeQuestions(!!checked)}
              disabled={disabled}
            />
            <Label
              htmlFor="randomizeQuestions"
              className="text-sm font-normal cursor-pointer"
            >
              Randomizar orden de preguntas
            </Label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-3 block">Preguntas</Label>
        <div className="space-y-4">
          {questions.length !== 8 ? (
            <div className="text-center py-8 border-2 border-dashed border-red-300 bg-red-50 text-red-700 rounded-lg">
              <p className="font-semibold">Error de Configuración</p>
              <p>Se esperaba encontrar 8 preguntas, pero se encontraron {questions.length}.</p>
              <p>Por favor, recargue la página o contacte soporte.</p>
            </div>
          ) : (
            questions.map((question) => {
              
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
                  question={question}
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