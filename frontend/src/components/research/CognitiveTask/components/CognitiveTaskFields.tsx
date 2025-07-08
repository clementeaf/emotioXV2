import { Info } from 'lucide-react';
import React, { useState } from 'react';
import type { Question } from 'shared/interfaces/cognitive-task.interface';

import { Button } from '@/components/ui/Button';
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

// Modal simple para seleccionar tipo de pregunta
interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (type: Question['type']) => void;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({ isOpen, onClose, onAddQuestion }) => {
  if (!isOpen) {return null;}

  const questionTypes = [
    { id: 'short_text', label: 'Texto Corto', description: 'Respuesta corta de texto' },
    { id: 'long_text', label: 'Texto Largo', description: 'Respuesta larga de texto' },
    { id: 'single_choice', label: 'Opción Única', description: 'Seleccionar una opción' },
    { id: 'multiple_choice', label: 'Opción Múltiple', description: 'Seleccionar múltiples opciones' },
    { id: 'linear_scale', label: 'Escala Lineal', description: 'Escala numérica' },
    { id: 'ranking', label: 'Ranking', description: 'Ordenar opciones por preferencia' },
    { id: 'navigation_flow', label: 'Flujo de Navegación', description: 'Prueba de flujo de navegación' },
    { id: 'preference_test', label: 'Prueba de Preferencia', description: 'Prueba A/B de preferencia' }
  ] as const;

  const handleSelect = (type: Question['type']) => {
    onAddQuestion(type);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Añadir nueva pregunta</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Seleccione el tipo de pregunta que desea agregar:
        </p>

        <div className="space-y-2">
          {questionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => handleSelect(type.id as Question['type'])}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium">{type.label}</div>
              <div className="text-sm text-gray-600">{type.description}</div>
            </button>
          ))}
        </div>
      </div>
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  // LOG INICIAL AL RECIBIR PROPS
  // console.log('[CognitiveTaskFields] Props RECIBIDAS - questions:',
  //   JSON.stringify(questions?.map(q => ({ id: q.id, type: q.type, title: q.title?.substring(0, 20) })) || [], null, 2)
  // );

  return (
    <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
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
          {questions.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 rounded-lg">
              <p className="font-semibold">No hay preguntas configuradas</p>
              <p>Añade preguntas para configurar tu tarea cognitiva.</p>
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

          {/* Botón para agregar nueva pregunta */}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              disabled={disabled}
              className="w-full"
            >
              + Añadir Pregunta
            </Button>
          </div>
        </div>
      </div>

      {/* Modal para seleccionar tipo de pregunta */}
      <AddQuestionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddQuestion={onAddQuestion}
      />
    </div>
  );
};
