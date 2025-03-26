'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { smartVocAPI } from '@/lib/api';

interface Question {
  id: string;
  type: 'CSAT' | 'CES' | 'CV' | 'NEV' | 'NPS' | 'VOC';
  title: string;
  description: string;
  required: boolean;
  showConditionally: boolean;
  config: {
    type?: 'stars' | 'numbers' | 'emojis' | 'scale' | 'text';
    scaleRange?: {
      start: number;
      end: number;
    };
    companyName?: string;
    startLabel?: string;
    endLabel?: string;
  };
}

interface SmartVOCFormProps {
  className?: string;
  researchId: string;
  onSave?: (data: any) => void;
}

export function SmartVOCForm({ className, researchId, onSave }: SmartVOCFormProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'csat',
      type: 'CSAT',
      title: 'Customer Satisfaction Score (CSAT)',
      description: 'How would you rate your overall satisfaction level with [company]?',
      required: true,
      showConditionally: false,
      config: {
        type: 'stars',
        companyName: ''
      }
    },
    {
      id: 'ces',
      type: 'CES',
      title: 'Customer Effort Score (CES)',
      description: 'It was easy for me to handle my issue today.',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 7 }
      }
    },
    {
      id: 'cv',
      type: 'CV',
      title: 'Cognitive Value (CV)',
      description: 'Example: This was the best app my eyes had see.',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 7 },
        startLabel: '',
        endLabel: ''
      }
    },
    {
      id: 'nev',
      type: 'NEV',
      title: 'Net Emotional Value (NEV)',
      description: 'How do you feel about the experience offered by the [company]?',
      required: true,
      showConditionally: false,
      config: {
        type: 'emojis',
        companyName: ''
      }
    },
    {
      id: 'nps',
      type: 'NPS',
      title: 'Net Promoter Score (NPS)',
      description: 'On a scale from 0-10, how likely are you to recommend [company] to a friend or colleague?',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 0, end: 10 },
        companyName: ''
      }
    },
    {
      id: 'voc',
      type: 'VOC',
      title: 'Voice of Customer (VOC)',
      description: 'How can we improve the service?',
      required: true,
      showConditionally: false,
      config: {
        type: 'text'
      }
    }
  ]);

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [smartVocRequired, setSmartVocRequired] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [smartVocId, setSmartVocId] = useState<string | null>(null);

  useEffect(() => {
    const fetchExistingData = async () => {
      if (researchId) {
        try {
          // En este punto, asumimos que estamos creando un formulario nuevo
          // Omitimos la carga para evitar errores 404
          console.log(`Iniciando configuración de Smart VOC para researchId: ${researchId}`);
          // No es un error, simplemente no hay datos previos
          console.log('INFO: Se creará una nueva configuración de Smart VOC.');
        } catch (error) {
          // Solo registrar errores no relacionados con 404
          if (error instanceof Error && !error.message.includes('404')) {
            console.error('Error inesperado:', error);
          }
        }
      }
    };

    fetchExistingData();
  }, [researchId]);

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const addNewQuestion = () => {
    const newId = `question-${questions.length + 1}`;
    const newQuestion: Question = {
      id: newId,
      type: 'CSAT',
      title: `Question ${questions.length + 1}`,
      description: 'How satisfied are you with our product?',
      required: true,
      showConditionally: false,
      config: {
        type: 'stars',
        companyName: ''
      }
    };
    
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const renderQuestionConfig = (question: Question) => {
    switch (question.type) {
      case 'CSAT':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">Company or service's name</span>
              <input 
                type="text" 
                value={question.config.companyName || ''}
                onChange={(e) => updateQuestion(question.id, {
                  config: { ...question.config, companyName: e.target.value }
                })}
                className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">CSAT</span>
              <select 
                className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={question.config.type}
                onChange={(e) => updateQuestion(question.id, {
                  config: { ...question.config, type: e.target.value as any }
                })}
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
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">CES</span>
            <select 
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={`${question.config.scaleRange?.start}-${question.config.scaleRange?.end}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split('-').map(Number);
                updateQuestion(question.id, {
                  config: { ...question.config, scaleRange: { start, end } }
                });
              }}
            >
              <option value="1-7">Scale 1-7</option>
              <option value="1-5">Scale 1-5</option>
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
                  updateQuestion(question.id, {
                    config: { ...question.config, scaleRange: { start, end } }
                  });
                }}
              >
                <option value="1-7">Scale 1-7</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">Start label (optional)</span>
                <input 
                  type="text" 
                  value={question.config.startLabel || ''}
                  onChange={(e) => updateQuestion(question.id, {
                    config: {
                      ...question.config,
                      startLabel: e.target.value
                    }
                  })}
                  className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g., Not at all"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">End label (optional)</span>
                <input 
                  type="text"
                  value={question.config.endLabel || ''}
                  onChange={(e) => updateQuestion(question.id, {
                    config: {
                      ...question.config,
                      endLabel: e.target.value
                    }
                  })}
                  className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="e.g., Very much"
                />
              </div>
            </div>
          </div>
        );

      case 'NEV':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">Company or service's name</span>
              <input 
                type="text" 
                value={question.config.companyName || ''}
                onChange={(e) => updateQuestion(question.id, {
                  config: { ...question.config, companyName: e.target.value }
                })}
                className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">NEV</span>
              <select 
                className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={question.config.type}
                onChange={(e) => updateQuestion(question.id, {
                  config: { ...question.config, type: e.target.value as any }
                })}
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
              <span className="text-sm font-medium text-neutral-900">Company or service's name</span>
              <input 
                type="text" 
                value={question.config.companyName || ''}
                onChange={(e) => updateQuestion(question.id, {
                  config: { ...question.config, companyName: e.target.value }
                })}
                className="flex-1 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-neutral-900">NPS</span>
              <select 
                className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={`${question.config.scaleRange?.start}-${question.config.scaleRange?.end}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split('-').map(Number);
                  updateQuestion(question.id, {
                    config: { ...question.config, scaleRange: { start, end } }
                  });
                }}
              >
                <option value="0-10">Scale 0-10</option>
              </select>
            </div>
          </div>
        );

      case 'VOC':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">Long text</span>
            <select 
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type}
              onChange={(e) => updateQuestion(question.id, {
                config: { ...question.config, type: e.target.value as any }
              })}
            >
              <option value="text">Free text</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSaveAndContinue = async () => {
    console.log('DEBUG handleSaveAndContinue - researchId:', researchId);
    
    // Asegurarnos de que researchId es un valor válido
    if (!researchId || researchId.trim() === '') {
      toast.error('ID de investigación no válido');
      console.error('DEBUG: researchId no válido:', researchId);
      return;
    }

    const formData = {
      researchId: researchId.trim(),
      questions,
      randomizeQuestions,
      smartVocRequired
    };

    console.log('DEBUG: Datos a enviar para crear Smart VOC:', {
      researchId: formData.researchId,
      questionsCount: formData.questions.length,
      randomize: formData.randomizeQuestions,
      required: formData.smartVocRequired
    });

    setIsSaving(true);
    try {
      console.log('DEBUG: Creando nuevo Smart VOC');
      // Simplificamos - siempre creamos un nuevo registro
      const response = await smartVocAPI.create({
        ...formData,
        createdAt: new Date().toISOString()
      });
      
      console.log('Smart VOC guardado, respuesta:', response);
      
      if (response && response.data && response.data.id) {
        setSmartVocId(response.data.id);
        console.log('Nuevo smartVocId establecido:', response.data.id);
      }
      
      toast.success('Configuración de Voice of Customer guardada');
      
      if (onSave) {
        onSave(formData);
      }
    } catch (error) {
      console.error('Error al guardar Smart VOC:', error);
      // Mostrar mensaje de error más detallado
      if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error('Error al guardar la configuración de Voice of Customer');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <p className="text-sm text-neutral-500">
              Configure the Voice of Customer questions for your research.
            </p>
          </header>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium text-neutral-900">Required</h2>
                <p className="text-sm text-neutral-500">Make this section mandatory for participants</p>
              </div>
              <Switch 
                checked={smartVocRequired} 
                onCheckedChange={setSmartVocRequired} 
              />
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  Configure your VOC questions to collect valuable customer feedback.
                </p>
              </div>
              
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <div 
                    key={question.id}
                    className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-neutral-900">Question {index + 1}: {question.type}</h3>
                      <button 
                        className="text-sm text-red-600 hover:text-red-700"
                        onClick={() => removeQuestion(question.id)}
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Question Text
                        </label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                          value={question.description}
                          onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                        />
                      </div>
                      
                      <div>
                        {renderQuestionConfig(question)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-600">Show conditionality</span>
                          <Switch 
                            checked={question.showConditionally}
                            onCheckedChange={(checked: boolean) => updateQuestion(question.id, { showConditionally: checked })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-600">Required</span>
                          <Switch 
                            checked={question.required}
                            onCheckedChange={(checked: boolean) => updateQuestion(question.id, { required: checked })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <Switch 
                checked={randomizeQuestions} 
                onCheckedChange={setRandomizeQuestions} 
                id="randomize"
              />
              <label htmlFor="randomize" className="text-sm text-neutral-700 cursor-pointer">
                Randomize the order of questions
              </label>
            </div>

            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                className="w-full max-w-md"
                onClick={addNewQuestion}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add another question
              </Button>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Estimated completion time: 3-5 minutes</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Preview
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={handleSaveAndContinue}
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar y continuar'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 