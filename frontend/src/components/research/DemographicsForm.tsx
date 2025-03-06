'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { cn } from '@/lib/utils';

interface DemographicsFormProps {
  className?: string;
}

interface DemographicQuestion {
  id: string;
  label: string;
  type: 'single-choice' | 'multiple-choice' | 'text' | 'number';
  isRequired: boolean;
  enabled: boolean;
  options?: string[];
}

export function DemographicsForm({ className }: DemographicsFormProps) {
  const [questions, setQuestions] = useState<DemographicQuestion[]>([
    {
      id: 'age',
      label: 'Age',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']
    },
    {
      id: 'gender',
      label: 'Gender',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['Male', 'Female', 'Non-binary', 'Prefer not to say']
    },
    {
      id: 'country',
      label: 'Country of Residence',
      type: 'single-choice',
      isRequired: true,
      enabled: true,
      options: ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Other']
    },
    {
      id: 'education',
      label: 'Education Level',
      type: 'single-choice',
      isRequired: false,
      enabled: true,
      options: ['High School', 'Some College', 'Bachelor\'s Degree', 'Master\'s Degree', 'Doctorate', 'Other']
    },
    {
      id: 'income',
      label: 'Annual Household Income',
      type: 'single-choice',
      isRequired: false,
      enabled: true,
      options: ['Less than $25,000', '$25,000-$49,999', '$50,000-$74,999', '$75,000-$99,999', '$100,000+', 'Prefer not to say']
    },
    {
      id: 'employment',
      label: 'Employment Status',
      type: 'single-choice',
      isRequired: false,
      enabled: true,
      options: ['Full-time', 'Part-time', 'Self-employed', 'Unemployed', 'Student', 'Retired', 'Other']
    },
    {
      id: 'internet_usage',
      label: 'Daily Hours Online',
      type: 'single-choice',
      isRequired: false,
      enabled: false,
      options: ['Less than 1 hour', '1-3 hours', '4-6 hours', '7-9 hours', '10+ hours']
    },
    {
      id: 'tech_proficiency',
      label: 'Technical Proficiency',
      type: 'single-choice',
      isRequired: false,
      enabled: false,
      options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }
  ]);

  const toggleQuestionEnabled = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {...q, enabled: !q.enabled} : q
    ));
  };

  const toggleQuestionRequired = (questionId: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? {...q, isRequired: !q.isRequired} : q
    ));
  };

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Form Content */}
      <div className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_6px_16px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="px-8 py-8">
          <header className="mb-6">
            <h1 className="text-lg font-semibold text-neutral-900">
              2.1 - Demographic Questions
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Configure standard demographic questions that will be asked to all participants.
            </p>
          </header>

          <div className="space-y-6">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-amber-800">
                  Demographic questions help you understand your research audience better. Enable only the questions that are relevant to your research objectives.
                </p>
              </div>
            </div>

            {/* List of questions */}
            <div className="space-y-4">
              {questions.map((question) => (
                <div 
                  key={question.id} 
                  className={cn(
                    "border rounded-lg overflow-hidden",
                    question.enabled ? "border-neutral-200" : "border-neutral-200 bg-neutral-50"
                  )}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <h3 className={cn(
                          "text-sm font-medium",
                          question.enabled ? "text-neutral-900" : "text-neutral-500"
                        )}>
                          {question.label}
                        </h3>
                        {question.isRequired && question.enabled && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Required</span>
                        )}
                      </div>
                      <Switch 
                        checked={question.enabled}
                        onCheckedChange={() => toggleQuestionEnabled(question.id)}
                      />
                    </div>
                    
                    {question.enabled && (
                      <>
                        <div className="mb-3">
                          <div className="text-xs text-neutral-500 mb-1">Question Type</div>
                          <div className="text-sm">{question.type.replace('-', ' ').replace(/^\w/, c => c.toUpperCase())}</div>
                        </div>
                        
                        {question.options && (
                          <div className="mb-3">
                            <div className="text-xs text-neutral-500 mb-1">Options</div>
                            <div className="flex flex-wrap gap-2">
                              {question.options.map((option, index) => (
                                <span key={index} className="text-xs px-2 py-1 bg-neutral-100 rounded-full">
                                  {option}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center mt-4">
                          <div className="flex items-center mr-4">
                            <input
                              type="checkbox"
                              id={`required-${question.id}`}
                              checked={question.isRequired}
                              onChange={() => toggleQuestionRequired(question.id)}
                              className="mr-2 rounded border-neutral-300"
                            />
                            <label htmlFor={`required-${question.id}`} className="text-sm">
                              Make Required
                            </label>
                          </div>
                          <Button size="sm" variant="outline">Edit Options</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add new question button */}
            <div className="pt-2">
              <Button variant="outline" className="w-full">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Custom Demographic Question
              </Button>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between px-8 py-4 bg-neutral-50 border-t border-neutral-100">
          <p className="text-sm text-neutral-500">Changes are saved automatically</p>
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
            >
              Save and Continue
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
} 