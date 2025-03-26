'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';
  title: string;
  description?: string;
  required: boolean;
  showConditionally: boolean;
  choices?: Array<{
    id: string;
    text: string;
    isQualify?: boolean;
    isDisqualify?: boolean;
  }>;
  scaleConfig?: {
    startValue: number;
    endValue: number;
  };
  files?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  deviceFrame?: boolean;
}

interface CognitiveTaskFormProps {
  className?: string;
  onSave?: (data: any) => void;
}

export function CognitiveTaskForm({ className, onSave }: CognitiveTaskFormProps) {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '3.1',
      type: 'short_text',
      title: '',
      required: true,
      showConditionally: false,
      deviceFrame: false
    },
    {
      id: '3.2',
      type: 'long_text',
      title: '',
      required: true,
      showConditionally: false,
      deviceFrame: false
    },
    {
      id: '3.3',
      type: 'single_choice',
      title: '',
      required: true,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false
    },
    {
      id: '3.4',
      type: 'multiple_choice',
      title: '',
      required: true,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false
    },
    {
      id: '3.5',
      type: 'linear_scale',
      title: '',
      required: true,
      showConditionally: false,
      scaleConfig: {
        startValue: 1,
        endValue: 5
      },
      deviceFrame: false
    },
    {
      id: '3.6',
      type: 'ranking',
      title: '',
      required: true,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false
    },
    {
      id: '3.7',
      type: 'navigation_flow',
      title: '',
      required: true,
      showConditionally: false,
      files: [],
      deviceFrame: false
    },
    {
      id: '3.8',
      type: 'preference_test',
      title: '',
      required: true,
      showConditionally: false,
      files: [],
      deviceFrame: false
    }
  ]);

  const [randomizeQuestions, setRandomizeQuestions] = useState(false);
  const [isAddQuestionModalOpen, setIsAddQuestionModalOpen] = useState(false);

  const questionTypes = [
    { id: 'short_text', label: 'Short Text', description: 'Short text' },
    { id: 'long_text', label: 'Long Text', description: 'Long text' },
    { id: 'single_choice', label: 'Single Choice', description: 'Pick one option' },
    { id: 'multiple_choice', label: 'Multiple Choice', description: 'Pick multiple options' },
    { id: 'linear_scale', label: 'Linear Scale', description: 'For numerical scale' },
    { id: 'ranking', label: 'Ranking', description: 'Rank options in order' },
    { id: 'navigation_flow', label: 'Navigation Flow', description: 'Navigation flow test' },
    { id: 'preference_test', label: 'Preference Test', description: 'A/B testing' }
  ];

  const handleQuestionChange = (questionId: string, updates: Partial<Question>) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    );
  };

  const handleAddChoice = (questionId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId && q.choices
          ? {
            ...q,
            choices: [
              ...q.choices,
              { id: String(q.choices.length + 1), text: '', isQualify: false, isDisqualify: false }
            ]
          }
          : q
      )
    );
  };

  const handleRemoveChoice = (questionId: string, choiceId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(q =>
        q.id === questionId && q.choices
          ? {
            ...q,
            choices: q.choices.filter(c => c.id !== choiceId)
          }
          : q
      )
    );
  };

  const handleFileUpload = (questionId: string, files: FileList) => {
    // Implementar lógica de carga de archivos
  };

  const handleAddQuestion = (type: Question['type']) => {
    const newQuestionId = `3.${questions.length + 1}`;
    const newQuestion: Question = {
      id: newQuestionId,
      type,
      title: '',
      required: true,
      showConditionally: false,
      deviceFrame: false
    };

    // Add specific properties based on question type
    if (['single_choice', 'multiple_choice', 'ranking'].includes(type)) {
      newQuestion.choices = [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ];
    } else if (type === 'linear_scale') {
      newQuestion.scaleConfig = {
        startValue: 1,
        endValue: 5
      };
    } else if (['navigation_flow', 'preference_test'].includes(type)) {
      newQuestion.files = [];
    }

    setQuestions([...questions, newQuestion]);
    setIsAddQuestionModalOpen(false);
  };

  const renderQuestionInput = (question: Question) => {
    switch (question.type) {
      case 'short_text':
      case 'long_text':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Add question"
                value={question.title}
                onChange={(e) => handleQuestionChange(question.id, { title: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Show conditionally</span>
                  <Switch
                    checked={question.showConditionally}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { showConditionally: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Required</span>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { required: checked })}
                  />
                </div>
              </div>
            </div>
            {question.type === 'short_text' ? (
              <Input placeholder="Short text answer" disabled className="bg-neutral-50" />
            ) : (
              <Textarea placeholder="Long text answer" disabled className="bg-neutral-50" />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Device Frame</span>
                <Switch
                  checked={question.deviceFrame}
                  onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { deviceFrame: checked })}
                />
              </div>
              <span className="text-xs text-neutral-500">No Frame</span>
            </div>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Add question"
                value={question.title}
                onChange={(e) => handleQuestionChange(question.id, { title: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Show conditionally</span>
                  <Switch
                    checked={question.showConditionally}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { showConditionally: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Required</span>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { required: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {question.choices?.map((choice) => (
                <div key={choice.id} className="flex items-center gap-4">
                  <Input
                    placeholder="Add choice"
                    value={choice.text}
                    onChange={(e) => {
                      const newChoices = question.choices?.map(c =>
                        c.id === choice.id ? { ...c, text: e.target.value } : c
                      );
                      handleQuestionChange(question.id, { choices: newChoices });
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Qualify</span>
                      <Switch
                        checked={choice.isQualify}
                        onCheckedChange={(checked: boolean) => {
                          const newChoices = question.choices?.map(c =>
                            c.id === choice.id ? { ...c, isQualify: checked } : c
                          );
                          handleQuestionChange(question.id, { choices: newChoices });
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Disqualify</span>
                      <Switch
                        checked={choice.isDisqualify}
                        onCheckedChange={(checked: boolean) => {
                          const newChoices = question.choices?.map(c =>
                            c.id === choice.id ? { ...c, isDisqualify: checked } : c
                          );
                          handleQuestionChange(question.id, { choices: newChoices });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveChoice(question.id, choice.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleAddChoice(question.id)}
              variant="outline"
              className="w-full"
            >
              Add another choice
            </Button>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Device Frame</span>
                <Switch
                  checked={question.deviceFrame}
                  onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { deviceFrame: checked })}
                />
              </div>
              <span className="text-xs text-neutral-500">No Frame</span>
            </div>
          </div>
        );

      case 'linear_scale':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Add question"
                value={question.title}
                onChange={(e) => handleQuestionChange(question.id, { title: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Show conditionally</span>
                  <Switch
                    checked={question.showConditionally}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { showConditionally: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Required</span>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { required: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Start value</span>
                <Input
                  type="number"
                  value={question.scaleConfig?.startValue ?? 1}
                  onChange={(e) => handleQuestionChange(question.id, {
                    scaleConfig: { 
                      startValue: Number(e.target.value),
                      endValue: question.scaleConfig?.endValue ?? 5
                    }
                  })}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">End value</span>
                <Input
                  type="number"
                  value={question.scaleConfig?.endValue ?? 5}
                  onChange={(e) => handleQuestionChange(question.id, {
                    scaleConfig: {
                      startValue: question.scaleConfig?.startValue ?? 1,
                      endValue: Number(e.target.value)
                    }
                  })}
                  className="w-20"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Device Frame</span>
                <Switch
                  checked={question.deviceFrame}
                  onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { deviceFrame: checked })}
                />
              </div>
              <span className="text-xs text-neutral-500">No Frame</span>
            </div>
          </div>
        );

      case 'ranking':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Add question"
                value={question.title}
                onChange={(e) => handleQuestionChange(question.id, { title: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Show conditionally</span>
                  <Switch
                    checked={question.showConditionally}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { showConditionally: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Required</span>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { required: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {question.choices?.map((choice) => (
                <div key={choice.id} className="flex items-center gap-4">
                  <Input
                    placeholder="Add choice"
                    value={choice.text}
                    onChange={(e) => {
                      const newChoices = question.choices?.map(c =>
                        c.id === choice.id ? { ...c, text: e.target.value } : c
                      );
                      handleQuestionChange(question.id, { choices: newChoices });
                    }}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Qualify</span>
                      <Switch
                        checked={choice.isQualify}
                        onCheckedChange={(checked: boolean) => {
                          const newChoices = question.choices?.map(c =>
                            c.id === choice.id ? { ...c, isQualify: checked } : c
                          );
                          handleQuestionChange(question.id, { choices: newChoices });
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-600">Disqualify</span>
                      <Switch
                        checked={choice.isDisqualify}
                        onCheckedChange={(checked: boolean) => {
                          const newChoices = question.choices?.map(c =>
                            c.id === choice.id ? { ...c, isDisqualify: checked } : c
                          );
                          handleQuestionChange(question.id, { choices: newChoices });
                        }}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveChoice(question.id, choice.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleAddChoice(question.id)}
              variant="outline"
              className="w-full"
            >
              Add another choice
            </Button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Device Frame</span>
                <Switch
                  checked={question.deviceFrame}
                  onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { deviceFrame: checked })}
                />
              </div>
              <span className="text-xs text-neutral-500">No Frame</span>
            </div>
          </div>
        );

      case 'navigation_flow':
      case 'preference_test':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Add question"
                value={question.title}
                onChange={(e) => handleQuestionChange(question.id, { title: e.target.value })}
                className="flex-1"
              />
              <div className="flex items-center gap-4 ml-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Show conditionally</span>
                  <Switch
                    checked={question.showConditionally}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { showConditionally: checked })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Required</span>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { required: checked })}
                  />
                </div>
              </div>
            </div>
            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-neutral-100 mb-4">
                  <svg className="w-6 h-6 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600 mb-2">
                  Click or drag file to this area to upload
                </p>
                <p className="text-xs text-neutral-500">
                  Support for a single or bulk upload. Max file size 5MB.
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => e.target.files && handleFileUpload(question.id, e.target.files)}
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-600">Device Frame</span>
                <Switch
                  checked={question.deviceFrame}
                  onCheckedChange={(checked: boolean) => handleQuestionChange(question.id, { deviceFrame: checked })}
                />
              </div>
              <span className="text-xs text-neutral-500">No Frame</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-3xl mx-auto', className)}>
      <div>
        <div className="space-y-6">
          {/* Global Settings */}
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
            <div className="space-y-0.5">
              <h2 className="text-sm font-medium text-neutral-900">Randomize Questions</h2>
              <p className="text-sm text-neutral-500">Present questions in random order to each participant</p>
            </div>
            <Switch 
              checked={randomizeQuestions} 
              onCheckedChange={setRandomizeQuestions} 
            />
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900">Questions</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddQuestionModalOpen(true)}
                className="text-blue-500 border-blue-200 hover:bg-blue-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div 
                  key={question.id} 
                  className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="bg-neutral-100 text-neutral-700 py-1 px-2.5 text-xs font-medium rounded">
                        {questionTypes.find(t => t.id === question.type)?.label || question.type}
                      </span>
                      <p className="text-xs text-neutral-500">ID: {question.id}</p>
                    </div>
                    <button className="text-neutral-400 hover:text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>

                  {renderQuestionInput(question)}
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-2">
              <Button 
                variant="outline" 
                className="w-full max-w-md"
                onClick={() => setIsAddQuestionModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add New Question
              </Button>
            </div>
          </div>
        </div>
      </div>

      <footer className="flex items-center justify-between px-8 py-4 mt-6 bg-neutral-50 rounded-lg border border-neutral-100">
        <p className="text-sm text-neutral-500">Estimated completion time: 5-7 minutes</p>
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

      {/* Add Question Modal */}
      <Dialog open={isAddQuestionModalOpen} onOpenChange={setIsAddQuestionModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add new question</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {questionTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleAddQuestion(type.id as Question['type'])}
                className="flex flex-col items-start p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <h3 className="text-sm font-medium text-neutral-900">{type.label}</h3>
                <p className="text-xs text-neutral-500 mt-1">{type.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 