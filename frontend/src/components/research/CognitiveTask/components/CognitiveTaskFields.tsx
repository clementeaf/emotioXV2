import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Question } from '../types';
import { QuestionCard } from './QuestionCard';
import { AddQuestionModal } from './AddQuestionModal';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Info, Plus } from 'lucide-react';

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
  onAddQuestion: (type: Question['type']) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
  FileItemComponent?: React.ComponentType<any>;
  FileUploaderComponent?: React.ComponentType<any>;
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
}) => {
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  // Definir los tipos de preguntas disponibles
  const questionTypes = [
    {id: 'short_text' as Question['type'], label: 'Texto'},
    {id: 'long_text' as Question['type'], label: 'Párrafo'},
    {id: 'single_choice' as Question['type'], label: 'Opción Única'},
    {id: 'multiple_choice' as Question['type'], label: 'Opción Múltiple'},
    {id: 'linear_scale' as Question['type'], label: 'Escala'},
    {id: 'ranking' as Question['type'], label: 'Ranking'},
    {id: 'navigation_flow' as Question['type'], label: 'Navegación'},
    {id: 'preference_test' as Question['type'], label: 'Preferencia'}
  ];

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

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <Label className="text-sm font-medium">Preguntas</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddQuestionModalOpen(true)}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar pregunta
          </Button>
        </div>

        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-neutral-200 rounded-lg">
              <p className="text-neutral-500">No hay preguntas configuradas</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddQuestionModalOpen(true)}
                className="mt-4"
                disabled={disabled}
              >
                Añadir Pregunta
              </Button>
            </div>
          ) : (
            questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onQuestionChange={onQuestionChange}
                onAddChoice={onAddChoice}
                onRemoveChoice={onRemoveChoice}
                onFileUpload={onFileUpload}
                onFileDelete={onFileDelete}
                disabled={disabled}
                validationErrors={{}}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
              />
            ))
          )}
        </div>
      </div>

      <AddQuestionModal 
        isOpen={isAddQuestionModalOpen}
        onClose={() => setIsAddQuestionModalOpen(false)}
        onAddQuestion={onAddQuestion}
      />
    </div>
  );
}; 