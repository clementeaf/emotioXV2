import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { QuestionTypeConfig } from '../hooks/useDynamicQuestionForm';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (questionType: string) => void;
  availableQuestionTypes: QuestionTypeConfig[];
  existingQuestionTypes: string[];
}

/**
 * Modal genérico para agregar nuevas preguntas
 * Funciona con cualquier módulo usando configuración dinámica
 */
export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestion,
  availableQuestionTypes,
  existingQuestionTypes
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [instructions, setInstructions] = useState('');

  if (!isOpen) return null;

  // Filtrar tipos disponibles (que no se hayan agregado ya)
  const availableTypes = availableQuestionTypes.filter(
    type => !existingQuestionTypes.includes(type.id)
  );

  const handleAddQuestion = () => {
    if (!selectedType) return;

    onAddQuestion(selectedType);
    
    // Resetear estado
    setSelectedType(null);
    setInstructions('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Pregunta</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <p className="text-sm text-neutral-500">
            Selecciona el tipo de pregunta que deseas agregar
          </p>

          {availableTypes.length === 0 ? (
            <div className="p-4 bg-amber-50 rounded-md">
              <p className="text-sm text-amber-800">
                Ya has agregado todos los tipos de preguntas disponibles.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                {availableTypes.map((questionType) => (
                  <div
                    key={questionType.id}
                    onClick={() => setSelectedType(questionType.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedType === questionType.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <h3 className="font-medium">{questionType.name}</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {questionType.description}
                    </p>
                    {questionType.info && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {questionType.info}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedType && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Instrucciones adicionales (opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md resize-y min-h-[80px]"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Ingresa instrucciones adicionales para esta pregunta..."
                  />
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddQuestion}
            disabled={!selectedType || availableTypes.length === 0}
          >
            Agregar Pregunta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
