'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';
import { smartVocFixedAPI } from '@/lib/smart-voc-api';

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
  const [isLoading, setIsLoading] = useState(false);

  const fetchExistingData = async () => {
    if (!researchId) {
      console.error('[SmartVOCForm] ID de investigación no proporcionado');
      return;
    }

    console.log(`[SmartVOCForm] Buscando configuración existente para investigación: ${researchId}`);
    setIsLoading(true);
    
    try {
      console.log('[SmartVOCForm] Usando la API de SmartVOC mejorada');
      const response = await smartVocFixedAPI.getByResearchId(researchId).send();
      
      console.log('[SmartVOCForm] Respuesta de API:', response);
      
      if (!response || !response.data) {
        console.log('[SmartVOCForm] No se encontró configuración existente - esto es normal para una nueva investigación');
        setIsLoading(false);
        return;
      }
      
      const existingData = response.data;
      setSmartVocId(existingData.id);
      console.log('[SmartVOCForm] ID de Smart VOC encontrado:', existingData.id);
      
      console.log('[SmartVOCForm] Datos completos recibidos:', JSON.stringify(existingData, null, 2));
      
      const questionsConfig = {
        CSAT: existingData.CSAT || false,
        CES: existingData.CES || false,
        CV: existingData.CV || false,
        NEV: existingData.NEV || false,
        NPS: existingData.NPS || false,
        VOC: existingData.VOC || false,
      };
      
      const enabledQuestions: Question[] = [];
      
      if (questionsConfig.CSAT) {
        enabledQuestions.push({
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
        });
      }
      
      if (questionsConfig.CES) {
        enabledQuestions.push({
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
        });
      }
      
      if (questionsConfig.CV) {
        enabledQuestions.push({
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
        });
      }
      
      if (questionsConfig.NEV) {
        enabledQuestions.push({
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
        });
      }
      
      if (questionsConfig.NPS) {
        enabledQuestions.push({
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
        });
      }
      
      if (questionsConfig.VOC) {
        enabledQuestions.push({
          id: 'voc',
          type: 'VOC',
          title: 'Voice of Customer (VOC)',
          description: 'How can we improve the service?',
          required: true,
          showConditionally: false,
          config: {
            type: 'text'
          }
        });
      }
      
      setQuestions(enabledQuestions);
      
      setRandomizeQuestions(existingData.randomize || false);
      setSmartVocRequired(existingData.requireAnswers || false);
      
      toast.success('Configuración existente cargada correctamente');
    } catch (error) {
      console.log('[SmartVOCForm] Error al cargar datos:', error);
      
      if (error instanceof Error && error.message.includes('401')) {
        console.error('[SmartVOCForm] Error de autenticación:', error);
        toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        return;
      }
      
      if (error instanceof Error && error.message.includes('404')) {
        console.log('[SmartVOCForm] No se encontró configuración - creando nueva');
      } else {
        toast.error(`Error al cargar la configuración: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (researchId) {
      fetchExistingData();
    }
  }, [researchId]);

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (updates.config && 'companyName' in updates.config && updates.config.companyName === undefined) {
          updates.config.companyName = '';
        }
        
        if (updates.config && ('startLabel' in updates.config || 'endLabel' in updates.config)) {
          if (updates.config.startLabel === undefined) updates.config.startLabel = '';
          if (updates.config.endLabel === undefined) updates.config.endLabel = '';
        }
        
        return { ...q, ...updates };
      }
      return q;
    }));
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
    if (!researchId) {
      toast.error('ID de investigación no proporcionado');
      console.error('[SmartVOCForm] Error: ID de investigación no proporcionado');
      return;
    }

    if (questions.length === 0) {
      toast.error('Debes seleccionar al menos una pregunta');
      return;
    }

    setIsSaving(true);
    
    try {
      const formData: any = {
        researchId,
        randomize: randomizeQuestions,
        requireAnswers: smartVocRequired,
      };
      
      formData.CSAT = questions.some(q => q.type === 'CSAT');
      formData.CES = questions.some(q => q.type === 'CES');
      formData.CV = questions.some(q => q.type === 'CV');
      formData.NEV = questions.some(q => q.type === 'NEV');
      formData.NPS = questions.some(q => q.type === 'NPS');
      formData.VOC = questions.some(q => q.type === 'VOC');
      
      console.log('[SmartVOCForm] Datos a guardar:', JSON.stringify(formData, null, 2));
      
      let response;
      
      if (smartVocId) {
        console.log(`[SmartVOCForm] Actualizando Smart VOC con ID: ${smartVocId}`);
        try {
          response = await smartVocFixedAPI.update(smartVocId, formData).send();
          console.log('[SmartVOCForm] Respuesta de actualización:', JSON.stringify(response, null, 2));
        } catch (updateError) {
          console.error('[SmartVOCForm] Error al actualizar:', updateError);
          throw updateError;
        }
      } else {
        console.log('[SmartVOCForm] Creando nuevo Smart VOC');
        try {
          response = await smartVocFixedAPI.create(formData).send();
          console.log('[SmartVOCForm] Respuesta de creación:', JSON.stringify(response, null, 2));
          
          if (response && response.id) {
            setSmartVocId(response.id);
            console.log(`[SmartVOCForm] Nuevo Smart VOC creado con ID: ${response.id}`);
          } else {
            console.warn('[SmartVOCForm] Se creó el Smart VOC pero no se recibió un ID en la respuesta');
          }
        } catch (createError) {
          console.error('[SmartVOCForm] Error al crear:', createError);
          throw createError;
        }
      }
      
      console.log('[SmartVOCForm] Operación completada con éxito');
      toast.success('Configuración de Smart VOC guardada correctamente');
      
      if (onSave) {
        onSave(formData);
      }
    } catch (error) {
      console.error('[SmartVOCForm] Error al guardar:', error);
      
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.');
        return;
      }
      
      toast.error(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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