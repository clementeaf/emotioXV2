import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

import { QuestionType } from 'shared/interfaces/question-types.enum';
import { UI_TEXTS } from '../constants';
import { SmartVOCQuestion, SmartVOCQuestionsProps } from '../types';

import { AddQuestionModal } from './AddQuestionModal';

/**
 * Componente para gestionar las preguntas de SmartVOC
 */
export const SmartVOCQuestions: React.FC<SmartVOCQuestionsProps> = ({
  questions,
  onUpdateQuestion,
  onAddQuestion,
  onRemoveQuestion,
  disabled
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);




  // Obtener los tipos de preguntas ya existentes
  const existingQuestionTypes = questions
    .map(q => q.type)
    .filter((t): t is QuestionType => ['CSAT', 'CES', 'CV', 'NEV', 'NPS', 'VOC'].includes(t));


  // Normalizar preguntas para la UI (solo para el componente, no para el backend)
  const questionsForUI = questions.map(q => ({
    ...q,
    // Mantener el tipo original para renderQuestionConfig
    type: q.type
  }));


  // Renderiza la configuración específica para cada tipo de pregunta
  const renderQuestionConfig = (question: SmartVOCQuestion) => {
    switch (question.type) {
      case QuestionType.SMARTVOC_CSAT:
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">Tipo de visualización</span>
            <select
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type || 'stars'}
              onChange={(e) => {
                const newType = e.target.value as any;
                onUpdateQuestion(question.id, {
                  config: { ...question.config, type: newType }
                });
              }}
              disabled={disabled}
            >
              <option value="stars">Estrellas</option>
              <option value="numbers">Números</option>
            </select>
          </div>
        );

      case QuestionType.SMARTVOC_CES:
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">CES</span>
            <div className="text-sm text-neutral-600 bg-neutral-100 px-3 py-2 rounded-lg">
              Escala fija 1-5
            </div>
          </div>
        );

      case QuestionType.SMARTVOC_CV:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">CV</span>
              <select
                className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={`${question.config.scaleRange?.start}-${question.config.scaleRange?.end}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-').map(Number);
                  onUpdateQuestion(question.id, {
                    config: { ...question.config, scaleRange: { start, end } }
                  });
                }}
                disabled={disabled}
              >
                <option value="1-5">Escala 1-5</option>
                <option value="1-7">Escala 1-7</option>
                <option value="1-10">Escala 1-10</option>
              </select>
              <div className="bg-amber-50 p-2 rounded text-xs text-amber-700">
                3 escalas principales de valoración en la región
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-4">
                <span className="text-sm text-neutral-500 w-32 text-right">{UI_TEXTS.QUESTIONS.START_LABEL_TEXT}</span>
                <input
                  type="text"
                  value={question.config.startLabel || ''}
                  onChange={(e) => onUpdateQuestion(question.id, {
                    config: {
                      ...question.config,
                      startLabel: e.target.value
                    }
                  })}
                  className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder={UI_TEXTS.QUESTIONS.START_LABEL_PLACEHOLDER}
                  disabled={disabled}
                />
              </div>
              <div className="flex gap-4">
                <span className="text-sm text-neutral-500 w-32 text-right">{UI_TEXTS.QUESTIONS.END_LABEL_TEXT}</span>
                <input
                  type="text"
                  value={question.config.endLabel || ''}
                  onChange={(e) => onUpdateQuestion(question.id, {
                    config: {
                      ...question.config,
                      endLabel: e.target.value
                    }
                  })}
                  className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder={UI_TEXTS.QUESTIONS.END_LABEL_PLACEHOLDER}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        );

      case QuestionType.SMARTVOC_NEV:
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-neutral-900">NEV</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">Jerarquía de Valor Emocional</span>
                </div>
              </div>
            </div>
          </div>
        );

      case QuestionType.SMARTVOC_NPS:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">NPS</span>
              <select
                className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={`${question.config.scaleRange?.start}-${question.config.scaleRange?.end}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-').map(Number);
                  onUpdateQuestion(question.id, {
                    config: { ...question.config, scaleRange: { start, end } }
                  });
                }}
                disabled={disabled}
              >
                <option value="0-10">Escala 0-10</option>
                <option value="0-6">Escala 0-6</option>
              </select>
            </div>
          </div>
        );

      case QuestionType.SMARTVOC_VOC:
        return null;

      default:
        return null;
    }
  };

  const handleAddQuestion = (question: SmartVOCQuestion) => {
    onAddQuestion(question);
  };

  return (
    <div className="space-y-6">

      {questionsForUI.map((question, index) => (
        <div key={question.id || index} className="p-6 border border-neutral-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-semibold text-neutral-900 text-base">{`Pregunta ${index + 1}: ${question.title}`}</h4>
            {questions.length > 1 && (
              <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onRemoveQuestion(question.id)} disabled={disabled}>
                Eliminar
              </Button>
            )}
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-neutral-900 block mb-2">Título de la pregunta</label>
              <input
                type="text"
                value={question.title}
                onChange={(e) => onUpdateQuestion(question.id, { title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Introduzca el título de la pregunta"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900 block mb-2">Descripción (opcional)</label>
              <textarea
                value={question.description || ''}
                onChange={(e) => onUpdateQuestion(question.id, { description: e.target.value })}
                className="w-full h-20 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Introduzca una descripción opcional para la pregunta"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900 block mb-2">Instrucciones (opcional)</label>
              <textarea
                value={question.instructions || ''}
                onChange={(e) => onUpdateQuestion(question.id, { instructions: e.target.value })}
                className="w-full h-24 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Añada instrucciones o información adicional para los participantes"
                disabled={disabled}
              />
            </div>

            {renderQuestionConfig(question)}

            {/* VISTA PREVIA */}
            <div className="mt-5 bg-neutral-50 p-3 border border-gray-300 rounded-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vista previa - Así verán esta pregunta los participantes
                <span className="ml-2 text-xs font-normal text-red-500">(NO EDITABLE)</span>
              </label>
              <div className="mt-2 text-sm text-gray-700 font-medium">{question.title || 'Título de la pregunta'}</div>
              {question.description && <div className="mt-1 text-sm text-gray-600">{question.description}</div>}
              {question.instructions && <div className="mt-1 text-xs text-gray-500">{question.instructions}</div>}

              {/* Renderizar vista previa según tipo */}
              <div className="mt-3">
                {question.type === QuestionType.SMARTVOC_CSAT && (
                  <div className="flex justify-center gap-2">
                    {question.config.type === 'stars' ? (
                      // Estrellas
                      Array.from({ length: 5 }, (_, i) => (
                        <span key={i} className="text-2xl text-gray-300">★</span>
                      ))
                    ) : (
                      // Números 1-5
                      <div className="flex gap-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded bg-white text-gray-600">
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {question.type === QuestionType.SMARTVOC_CES && (
                  <div className="flex justify-between items-center gap-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <input type="radio" disabled className="w-4 h-4 text-blue-600 cursor-not-allowed mb-1" />
                        <span className="text-xs text-gray-600">{i + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.SMARTVOC_CV && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">{question.config.startLabel || 'Inicio'}</span>
                      <span className="text-xs text-gray-600">{question.config.endLabel || 'Fin'}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      {Array.from(
                        { length: (question.config.scaleRange?.end || 7) - (question.config.scaleRange?.start || 1) + 1 },
                        (_, i) => (question.config.scaleRange?.start || 1) + i
                      ).map((value) => (
                        <div key={value} className="flex flex-col items-center">
                          <input type="radio" disabled className="w-4 h-4 text-blue-600 cursor-not-allowed mb-1" />
                          <span className="text-xs text-gray-600">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {question.type === QuestionType.SMARTVOC_NPS && (
                  <div className="flex justify-between items-center gap-1">
                    {Array.from(
                      { length: (question.config.scaleRange?.end || 10) - (question.config.scaleRange?.start || 0) + 1 },
                      (_, i) => (question.config.scaleRange?.start || 0) + i
                    ).map((value) => (
                      <div key={value} className="flex flex-col items-center">
                        <div className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded bg-white text-xs text-gray-600">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === QuestionType.SMARTVOC_NEV && (
                  <div className="text-center text-xs text-gray-500 italic">
                    Los participantes seleccionarán valores emocionales
                  </div>
                )}

                {question.type === QuestionType.SMARTVOC_VOC && (
                  <textarea
                    disabled
                    className="w-full h-24 p-3 rounded-lg bg-neutral-100 border border-gray-300 text-gray-400 cursor-not-allowed resize-none"
                    placeholder="Espacio para comentarios del participante..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Botón para agregar nueva pregunta */}
      <div className="pt-4">
        <Button
          variant="outline"
          onClick={() => setIsAddModalOpen(true)}
          disabled={disabled || existingQuestionTypes.length === 7} // Deshabilitar si todos los tipos ya existen
          className="w-full"
        >
          Añadir pregunta
        </Button>
      </div>

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddQuestion={handleAddQuestion}
        existingQuestionTypes={existingQuestionTypes}
      />
    </div>
  );
};
