'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Question {
  id: string;
  type: string;
  text: string;
  required?: boolean;
  showConditionality?: boolean;
  config?: {
    companyName?: string;
    scaleStart?: number;
    scaleEnd?: number;
    startLabel?: string;
    endLabel?: string;
    ratingType?: 'stars' | 'numbers' | 'emojis';
  };
}

interface SimplifiedSmartVOCFormProps {
  onSave?: (data: any) => void;
}

export function SimplifiedSmartVOCForm({ onSave }: SimplifiedSmartVOCFormProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q1',
      type: 'CSAT',
      text: 'How would you rate your overall satisfaction level with [company]?',
      required: true,
      showConditionality: false,
      config: {
        companyName: '',
        ratingType: 'stars'
      }
    }
  ]);
  const [randomizeQuestions, setRandomizeQuestions] = useState(false);

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `q${questions.length + 1}`,
      type: 'CSAT',
      text: 'How satisfied are you with our product?',
      required: true,
      showConditionality: false,
      config: {
        companyName: '',
        ratingType: 'stars'
      }
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleTypeChange = (id: string, type: string) => {
    let config = {};
    
    // Configuración por defecto según tipo
    switch(type) {
      case 'CSAT':
        config = { companyName: '', ratingType: 'stars' };
        break;
      case 'CES':
        config = { scaleStart: 1, scaleEnd: 7 };
        break;
      case 'CV':
        config = { scaleStart: 1, scaleEnd: 7, startLabel: '', endLabel: '' };
        break;
      case 'NEV':
        config = { companyName: '', ratingType: 'emojis' };
        break;
      case 'NPS':
        config = { companyName: '', scaleStart: 0, scaleEnd: 10 };
        break;
      case 'VOC':
        config = {};
        break;
    }
    
    setQuestions(questions.map(q => q.id === id ? { ...q, type, config } : q));
  };

  const handleTextChange = (id: string, text: string) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text } : q));
  };

  const handleConfigChange = (id: string, key: string, value: any) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          config: {
            ...q.config,
            [key]: value
          }
        };
      }
      return q;
    }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        questions,
        randomizeQuestions
      });
    }
  };

  // Renderiza campos adicionales según el tipo de pregunta
  const renderAdditionalFields = (question: Question) => {
    switch(question.type) {
      case 'CSAT':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Company or service's name
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                value={question.config?.companyName || ''}
                onChange={(e) => handleConfigChange(question.id, 'companyName', e.target.value)}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Rating Type
              </label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                value={question.config?.ratingType}
                onChange={(e) => handleConfigChange(question.id, 'ratingType', e.target.value)}
              >
                <option value="stars">Stars</option>
                <option value="numbers">Numbers</option>
                <option value="emojis">Emojis</option>
              </select>
            </div>
          </div>
        );
      
      case 'CES':
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Scale
            </label>
            <select 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              value={`${question.config?.scaleStart || 1}-${question.config?.scaleEnd || 7}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split('-').map(n => parseInt(n));
                handleConfigChange(question.id, 'scaleStart', start);
                handleConfigChange(question.id, 'scaleEnd', end);
              }}
            >
              <option value="1-7">Scale 1-7</option>
              <option value="1-5">Scale 1-5</option>
            </select>
          </div>
        );
      
      case 'CV':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Scale
              </label>
              <select 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                value={`${question.config?.scaleStart || 1}-${question.config?.scaleEnd || 7}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-').map(n => parseInt(n));
                  handleConfigChange(question.id, 'scaleStart', start);
                  handleConfigChange(question.id, 'scaleEnd', end);
                }}
              >
                <option value="1-7">Scale 1-7</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Start label (optional)
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                value={question.config?.startLabel || ''}
                onChange={(e) => handleConfigChange(question.id, 'startLabel', e.target.value)}
                placeholder="e.g., Not at all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                End label (optional)
              </label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                value={question.config?.endLabel || ''}
                onChange={(e) => handleConfigChange(question.id, 'endLabel', e.target.value)}
                placeholder="e.g., Very much"
              />
            </div>
          </div>
        );
      
      case 'NEV':
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Company or service's name
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              value={question.config?.companyName || ''}
              onChange={(e) => handleConfigChange(question.id, 'companyName', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
        );
      
      case 'NPS':
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Company or service's name
            </label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              value={question.config?.companyName || ''}
              onChange={(e) => handleConfigChange(question.id, 'companyName', e.target.value)}
              placeholder="Enter company name"
            />
          </div>
        );
      
      case 'VOC':
        return (
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Text Type
            </label>
            <select 
              className="w-full px-3 py-2 border border-neutral-300 rounded-md"
              defaultValue="long"
            >
              <option value="long">Long text</option>
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      <h2 className="text-xl font-medium mb-4">Smart VOC</h2>
      <p className="text-neutral-600 mb-4">
        Configure the Voice of Customer questions for your research.
      </p>
      <div className="space-y-6">
        {/* Mensaje azul informativo */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <p className="text-sm text-blue-800">
            Configure your VOC questions to collect valuable customer feedback.
          </p>
        </div>
        
        {/* Lista de preguntas */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="border border-neutral-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Question {index + 1}</h3>
                <button 
                  className="text-sm text-red-600 hover:text-red-700" 
                  onClick={() => handleRemoveQuestion(question.id)}
                >
                  Remove
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Question Type
                  </label>
                  <select 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    value={question.type}
                    onChange={(e) => handleTypeChange(question.id, e.target.value)}
                  >
                    <option value="CSAT">CSAT</option>
                    <option value="CES">CES</option>
                    <option value="CV">CV</option>
                    <option value="NEV">NEV</option>
                    <option value="NPS">NPS</option>
                    <option value="VOC">VOC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Question Text
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    value={question.text}
                    onChange={(e) => handleTextChange(question.id, e.target.value)}
                    placeholder="Enter your question here"
                  />
                </div>
                
                {/* Campos adicionales según tipo */}
                {renderAdditionalFields(question)}
                
                {/* Toggles */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-neutral-200">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`show-conditionality-${question.id}`}
                        checked={question.showConditionality || false}
                        onChange={(e) => setQuestions(questions.map(q => q.id === question.id ? { ...q, showConditionality: e.target.checked } : q))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`show-conditionality-${question.id}`} className="text-sm text-neutral-600">
                        Show conditionality
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id={`required-${question.id}`}
                        checked={question.required || false}
                        onChange={(e) => setQuestions(questions.map(q => q.id === question.id ? { ...q, required: e.target.checked } : q))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`required-${question.id}`} className="text-sm text-neutral-600">
                        Required
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <button 
            className="flex items-center text-blue-600 hover:text-blue-700"
            onClick={handleAddQuestion}
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Question
          </button>
        </div>
        
        {/* Checkbox para aleatorizar preguntas */}
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="randomize"
            checked={randomizeQuestions}
            onChange={() => setRandomizeQuestions(!randomizeQuestions)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="randomize" className="ml-2 block text-sm text-gray-700">
            Randomize the order of questions
          </label>
        </div>
        
        {/* Botón guardar */}
        <div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleSave}
          >
            Save Smart VOC
          </button>
        </div>
      </div>
    </div>
  );
} 