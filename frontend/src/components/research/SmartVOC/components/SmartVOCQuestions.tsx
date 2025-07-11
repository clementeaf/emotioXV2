import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';

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

  // ÚNICA FUENTE DE VERDAD para companyName
  const firstQuestionWithCompany = questions.find(q => q.config && 'companyName' in q.config);
  const [companyName, setCompanyName] = useState(firstQuestionWithCompany?.config.companyName || '');

  // Sincronizar el estado local si las props cambian desde fuera
  useEffect(() => {
    const firstQuestionWithCompany = questions.find(q => q.config && 'companyName' in q.config);
    setCompanyName(firstQuestionWithCompany?.config.companyName || '');
  }, [questions]);


  // Función para propagar el nombre de la empresa a todas las preguntas que lo utilizan
  const syncCompanyName = (newCompanyName: string) => {
    setCompanyName(newCompanyName); // Actualizar estado local para el input controlado

    // Actualizar todas las preguntas que usan companyName en el estado principal (formData)
    questions.forEach(question => {
      if (['CSAT', 'NEV', 'NPS'].includes(question.type)) {
        // Solo llamar a la actualización si el valor es realmente diferente
        if (question.config.companyName !== newCompanyName) {
          onUpdateQuestion(question.id, {
            config: { ...question.config, companyName: newCompanyName }
          });
        }
      }
    });
  };

  // Obtener los tipos de preguntas ya existentes
  const existingQuestionTypes = questions
    .map(q => q.type)
    .filter((t): t is QuestionType => ['CSAT','CES','CV','NEV','NPS','VOC'].includes(t));

  // Determinar si el campo de companyName debe mostrarse
  const showCompanyNameInput = questions.some(q => ['CSAT', 'NEV', 'NPS'].includes(q.type));

  // Normalizar preguntas para la UI (solo para el componente, no para el backend)
  const questionsForUI = questions.map(q => ({
    ...q,
    type: typeof q.type === 'string' && q.type.startsWith('smartvoc_') ? q.type.replace('smartvoc_', '') : q.type
  }));


  // Renderiza la configuración específica para cada tipo de pregunta
  const renderQuestionConfig = (question: SmartVOCQuestion) => {
    switch (question.type) {
      case 'CSAT':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">Tipo de visualización</span>
            <select
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type || 'stars'}
              onChange={(e) => onUpdateQuestion(question.id, {
                config: { ...question.config, type: e.target.value as any }
              })}
              disabled={disabled}
            >
              <option value="stars">Estrellas</option>
              <option value="numbers">Números</option>
            </select>
          </div>
        );

      case 'CES':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">CES</span>
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
              <option value="1-7">Escala 1-7</option>
              <option value="1-5">Escala 1-5</option>
            </select>
          </div>
        );

      case 'CV':
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

      case 'NEV':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">{UI_TEXTS.QUESTIONS.COMPANY_NAME_LABEL}</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={question.config.companyName || ''}
                  onChange={(e) => {
                    const newCompanyName = e.target.value;
                    // Sincronizar con todas las preguntas que usan companyName
                    syncCompanyName(newCompanyName);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder={UI_TEXTS.QUESTIONS.COMPANY_NAME_PLACEHOLDER}
                  disabled={disabled}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                    Se reutiliza
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-neutral-900">NEV</span>
                <select
                  className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={question.config.type}
                  onChange={(e) => onUpdateQuestion(question.id, {
                    config: { ...question.config, type: e.target.value as any }
                  })}
                  disabled={disabled}
                >
                  <option value="emojis">Escala emocional completa</option>
                  <option value="emojis_detailed">Emojis detallados (20 estados)</option>
                  <option value="quadrants">4 Estadios emocionales</option>
                </select>
              </div>
              <div className="bg-amber-50 p-3 rounded-md space-y-2">
                <p className="text-sm font-medium text-amber-800">Escala de valoración diferente</p>
                <div className="flex flex-col gap-1 text-xs text-amber-700">
                  <p>• 20 estados de ánimo diferentes</p>
                  <p>• Categorizados en 2 grandes grupos: Emociones positivas y negativas</p>
                  <p>• Estas emociones se clasifican en 4 estadios</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'NPS':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">{UI_TEXTS.QUESTIONS.COMPANY_NAME_LABEL}</span>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={question.config.companyName || ''}
                  onChange={(e) => {
                    const newCompanyName = e.target.value;
                    // Sincronizar con todas las preguntas que usan companyName
                    syncCompanyName(newCompanyName);
                  }}
                  className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder={UI_TEXTS.QUESTIONS.COMPANY_NAME_PLACEHOLDER}
                  disabled={disabled}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                    Se reutiliza
                  </div>
                </div>
              </div>
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
              </select>
            </div>
          </div>
        );

      case 'VOC':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">Texto largo</span>
            <select
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type}
              onChange={(e) => onUpdateQuestion(question.id, {
                config: { ...question.config, type: e.target.value as any }
              })}
              disabled={disabled}
            >
              <option value="text">Texto libre</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const handleAddQuestion = (question: SmartVOCQuestion) => {
    // Si se añade una pregunta que usa companyName, asegurarse que herede el valor actual
    if (['CSAT', 'NEV', 'NPS'].includes(question.type)) {
      question.config.companyName = companyName;
    }
    onAddQuestion(question);
  };

  return (
    <div className="space-y-6">
      {/* CAMPO ÚNICO Y CENTRALIZADO PARA EL NOMBRE DE LA EMPRESA */}
      {showCompanyNameInput && (
        <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">{UI_TEXTS.QUESTIONS.COMPANY_NAME_LABEL}</span>
            <div className="flex-1 relative">
              <input
                type="text"
                value={companyName}
                onChange={(e) => syncCompanyName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder={UI_TEXTS.QUESTIONS.COMPANY_NAME_PLACEHOLDER}
                disabled={disabled}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="text-xs text-amber-600 bg-amber-50 px-1 py-0.5 rounded">
                    Se reutiliza en todas las preguntas aplicables
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {questionsForUI.map((question, index) => (
        <div key={question.id || index} className="p-4 border border-neutral-200 rounded-lg bg-white">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-neutral-900">{`Pregunta ${index + 1}: ${question.title}`}</h4>
            {questions.length > 1 && (
              <Button variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => onRemoveQuestion(question.id)} disabled={disabled}>
                 Eliminar
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-900 block mb-1.5">Texto de la pregunta</label>
              <input
                type="text"
                value={question.title}
                onChange={(e) => onUpdateQuestion(question.id, { title: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Introduzca el texto de la pregunta"
                disabled={disabled}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-900 block mb-1.5">Instrucciones (opcional)</label>
              <textarea
                value={question.instructions || ''}
                onChange={(e) => onUpdateQuestion(question.id, { instructions: e.target.value })}
                className="w-full h-24 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Añada instrucciones o información adicional para los participantes"
                disabled={disabled}
              />
            </div>

            {renderQuestionConfig(question)}

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-neutral-100 mt-4">
              <span className="text-xs text-neutral-500">Mostrar condicionalmente</span>
              <Switch
                checked={question.showConditionally}
                onCheckedChange={(checked) => onUpdateQuestion(question.id, { showConditionally: checked })}
                disabled={disabled}
              />
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
