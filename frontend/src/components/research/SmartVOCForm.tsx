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
    <div className={cn("space-y-6", className)}>
      <header className="space-y-2">
        <h1 className="text-lg font-semibold text-neutral-900">
          2.0 - Smart VOC
        </h1>
        <p className="text-sm text-neutral-500">
          In this section you can go deeper in the understanding of the participants by using declarative questions oriented to the working memory and comprehension of the previous elements exposed.
        </p>
      </header>

      <div className="space-y-8">
        {/* CSAT Question */}
        <div className="space-y-4 bg-white rounded-lg border border-neutral-200 p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900">2.1 - Question: Customer Satisfaction Score (CSAT)</h3>
            <p className="text-sm text-neutral-600">How would you rate your overall satisfaction level with [company]?</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">CSAT</label>
              <select className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm">
                <option>Stars</option>
                <option>Numbers</option>
                <option>Emojis</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Show conditionally</span>
                <Switch />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Required</span>
                <Switch />
              </div>
            </div>
          </div>
        </div>

        {/* CES Question */}
        <div className="space-y-4 bg-white rounded-lg border border-neutral-200 p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900">2.2 - Question: Customer Effort Score (CES)</h3>
            <p className="text-sm text-neutral-600">It was easy for me to handle my issue today</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">CES</label>
              <select className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm">
                <option>Scale 1-7</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Show conditionally</span>
                <Switch />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Required</span>
                <Switch />
              </div>
            </div>
          </div>
        </div>

        {/* CV Question */}
        <div className="space-y-4 bg-white rounded-lg border border-neutral-200 p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900">2.3 - Question: Cognitive Value (CV)</h3>
            <p className="text-sm text-neutral-600">Evaluate how well the basic aspects are working</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">CV</label>
              <select className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm">
                <option>Scale 1-10</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Start value</label>
              <input
                type="number"
                value="1"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">End value</label>
              <input
                type="number"
                value="7"
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Show conditionally</span>
                <Switch />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Required</span>
                <Switch />
              </div>
            </div>
          </div>
        </div>

        {/* NEV Question */}
        <div className="space-y-4 bg-white rounded-lg border border-neutral-200 p-6">
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-neutral-900">2.4 - Question: Net Emotional Value (NEV)</h3>
            <p className="text-sm text-neutral-600">How do you feel about the experience offered by the [company]?</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">NEV</label>
              <select className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-sm">
                <option>Emojis</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Show conditionally</span>
                <Switch />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Required</span>
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estimated time */}
      <div className="flex items-center gap-2 text-sm text-neutral-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Estimated time: 8 to 11 mins</span>
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
        >
          Save and Preview
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        >
          Publish
        </button>
      </footer>
    </div>
  );
} 