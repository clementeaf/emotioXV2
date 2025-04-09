import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { CognitiveTaskFieldsProps, Question, QuestionType } from '../types';
import { QuestionCard } from './QuestionCard';
import { AddQuestionModal } from './AddQuestionModal';
import { UI_TEXTS } from '../constants';

// Definición de props explícita para evitar problemas de tipos
type Props = {
  questions: Question[];
  randomizeQuestions: boolean;
  onQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  onAddChoice: (questionId: string) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  onFileUpload: (questionId: string, files: FileList) => void;
  onRemoveFile: (questionId: string, fileId: string) => void;
  setRandomizeQuestions: (checked: boolean) => void;
  onAddQuestion: (type: QuestionType) => void;
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
  onRemoveFile,
  setRandomizeQuestions,
  onAddQuestion,
  disabled = false,
  isUploading,
  uploadProgress,
  FileItemComponent,
  FileUploaderComponent
}) => {
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Configuración global */}
      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
        <div className="space-y-0.5">
          <h2 className="text-sm font-medium text-neutral-900">Aleatorizar Preguntas</h2>
          <p className="text-sm text-neutral-500">Presentar preguntas en orden aleatorio a cada participante</p>
        </div>
        <Switch 
          checked={randomizeQuestions} 
          onCheckedChange={setRandomizeQuestions} 
          disabled={disabled}
        />
      </div>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-900">Preguntas</h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddQuestionModalOpen(true)}
            className="text-blue-500 border-blue-200 hover:bg-blue-50"
            type="button"
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Añadir Pregunta
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
                onRemoveFile={onRemoveFile}
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
        questionTypes={[]}
      />
    </div>
  );
}; 