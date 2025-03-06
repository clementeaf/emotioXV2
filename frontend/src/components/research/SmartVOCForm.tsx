'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

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
  };
}

interface SmartVOCFormProps {
  className?: string;
  onSave?: (data: any) => void;
}

export function SmartVOCForm({ className, onSave }: SmartVOCFormProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'csat',
      type: 'CSAT',
      title: 'Customer Satisfaction Score (CSAT)',
      description: 'How would you rate your overall satisfaction level with [company]?',
      required: true,
      showConditionally: false,
      config: {
        type: 'stars'
      }
    },
    {
      id: 'ces',
      type: 'CES',
      title: 'Customer Effort Score (CES)',
      description: 'It was easy for me to handle my issue today',
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
      description: 'Evaluate how well the basic aspects are working',
      required: true,
      showConditionally: false,
      config: {
        type: 'scale',
        scaleRange: { start: 1, end: 10 }
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
        type: 'emojis'
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
        scaleRange: { start: 0, end: 10 }
      }
    },
    {
      id: 'voc',
      type: 'VOC',
      title: 'Voice of Customer (VOC)',
      description: 'Share with us what you think about the service',
      required: true,
      showConditionally: false,
      config: {
        type: 'text'
      }
    }
  ]);

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const renderQuestionConfig = (question: Question) => {
    switch (question.type) {
      case 'CSAT':
        return (
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
              >
                <option value="1-10">Scale 1-10</option>
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">Start value</span>
                <input 
                  type="number" 
                  value={question.config.scaleRange?.start || 1}
                  onChange={(e) => updateQuestion(question.id, {
                    config: {
                      ...question.config,
                      scaleRange: {
                        start: parseInt(e.target.value),
                        end: question.config.scaleRange?.end || 10
                      }
                    }
                  })}
                  className="w-16 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">End value</span>
                <input 
                  type="number"
                  value={question.config.scaleRange?.end || 10}
                  onChange={(e) => updateQuestion(question.id, {
                    config: {
                      ...question.config,
                      scaleRange: {
                        start: question.config.scaleRange?.start || 1,
                        end: parseInt(e.target.value)
                      }
                    }
                  })}
                  className="w-16 h-10 px-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 'NEV':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">NEV</span>
            <select 
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type}
            >
              <option value="emojis">Emojis</option>
            </select>
          </div>
        );

      case 'NPS':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">NPS</span>
            <select 
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={`${question.config.scaleRange?.start}-${question.config.scaleRange?.end}`}
            >
              <option value="0-10">Scale 0-10</option>
            </select>
          </div>
        );

      case 'VOC':
        return (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-neutral-900">Long text</span>
            <select 
              className="h-10 pl-3 pr-10 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              value={question.config.type}
            >
              <option value="text">Free text</option>
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              Smart VOC Configuration
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure voice of customer questions to gather valuable feedback from participants.
            </p>
          </header>

          <div className="space-y-6">
            {/* Global Settings */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
              <div className="space-y-0.5">
                <h2 className="text-sm font-medium text-neutral-900">Randomize Questions</h2>
                <p className="text-sm text-neutral-500">Present questions in random order to participants</p>
              </div>
              <Switch 
                checked={randomizeQuestions} 
                onCheckedChange={setRandomizeQuestions} 
              />
            </div>

            {/* Question List */}
            <div className="space-y-4">
              <h2 className="text-sm font-medium text-neutral-900">Questions</h2>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div 
                    key={question.id}
                    className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-neutral-900">{question.title}</h3>
                      <p className="text-sm text-neutral-600">{question.description}</p>
                    </div>

                    <div>
                      {renderQuestionConfig(question)}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-600">Show conditionally</span>
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
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button variant="outline" className="w-full max-w-md">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add New Question
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
              onClick={() => onSave && onSave(questions)}
            >
              Save and Continue
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 