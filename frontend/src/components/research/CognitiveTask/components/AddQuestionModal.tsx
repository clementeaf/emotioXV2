import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { AddQuestionModalProps, QuestionType } from '../types';
import { UI_TEXTS } from '../constants';

/**
 * Componente para mostrar un modal para agregar nuevas preguntas
 */
export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  isOpen,
  onClose,
  onAddQuestion,
  questionTypes
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{UI_TEXTS.ADD_QUESTION_MODAL.TITLE}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-neutral-500 mb-4">
            {UI_TEXTS.ADD_QUESTION_MODAL.DESCRIPTION}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {questionTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => onAddQuestion(type.id)}
                className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <h3 className="font-medium">{type.label}</h3>
                <p className="text-sm text-neutral-500">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            {UI_TEXTS.ADD_QUESTION_MODAL.CLOSE_BUTTON}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 