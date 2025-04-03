import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { SmartVOCQuestionsProps, SmartVOCQuestion } from '../types';
import { UI_TEXTS } from '../constants';

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
  // Función para propagar el nombre de la empresa a todas las preguntas que lo utilizan
  const syncCompanyName = (companyName: string) => {
    // Actualizar todas las preguntas que usan companyName
    questions.forEach(question => {
      if (['CSAT', 'NEV', 'NPS'].includes(question.type) && 
          question.config.companyName !== companyName) {
        onUpdateQuestion(question.id, {
          config: { ...question.config, companyName }
        });
      }
    });
  };

  // Renderiza la configuración específica para cada tipo de pregunta
  const renderQuestionConfig = (question: SmartVOCQuestion) => {
    switch (question.type) {
      case 'CSAT':
        return (
          <div className="space-y-4">
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
                <option value="1-7">Escala 1-7</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">{UI_TEXTS.QUESTIONS.START_LABEL_TEXT}</span>
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">{UI_TEXTS.QUESTIONS.END_LABEL_TEXT}</span>
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
                <option value="emojis">Emojis</option>
              </select>
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

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-md">
        <p className="text-sm text-blue-800">
          Configure sus preguntas de VOC para recopilar feedback valioso de los clientes.
        </p>
      </div>
      
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div 
            key={question.id}
            className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-neutral-900">Pregunta {index + 1}: {question.type}</h3>
              <button 
                className="text-sm text-red-600 hover:text-red-700"
                onClick={() => onRemoveQuestion(question.id)}
                disabled={disabled}
              >
                {UI_TEXTS.QUESTIONS.REMOVE_BUTTON}
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  {UI_TEXTS.QUESTIONS.QUESTION_TEXT_LABEL}
                </label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                  value={question.description}
                  onChange={(e) => onUpdateQuestion(question.id, { description: e.target.value })}
                  disabled={disabled || ['CSAT', 'CES', 'NPS', 'NEV'].includes(question.type)}
                />
                {['CSAT', 'CES', 'NPS', 'NEV'].includes(question.type) && (
                  <p className="text-xs text-amber-600 mt-1">
                    Esta pregunta no se puede editar para mantener la consistencia de los indicadores.
                  </p>
                )}
              </div>
              
              <div>
                {renderQuestionConfig(question)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-4">
        <Button 
          variant="outline" 
          className="w-full max-w-md"
          onClick={onAddQuestion}
          disabled={disabled}
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {UI_TEXTS.QUESTIONS.ADD_BUTTON}
        </Button>
      </div>
    </div>
  );
}; 