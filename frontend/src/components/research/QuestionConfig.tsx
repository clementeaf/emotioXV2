'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

interface QuestionConfigProps {
  type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';
  value: {
    title?: string;
    required?: boolean;
    showConditionally?: boolean;
    options?: string[];
    scaleConfig?: {
      start: number;
      end: number;
    };
  };
  onChange: (value: any) => void;
}

export function QuestionConfig({ type, value, onChange }: QuestionConfigProps) {
  const [options, setOptions] = useState<string[]>(value.options || []);
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim()) {
      const updatedOptions = [...options, newOption.trim()];
      setOptions(updatedOptions);
      onChange({ ...value, options: updatedOptions });
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    onChange({ ...value, options: updatedOptions });
  };

  const renderQuestionConfig = () => {
    switch (type) {
      case 'short_text':
      case 'long_text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Question Text
              </label>
              <Input
                value={value.title || ''}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.required}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, required: checked })}
                />
                <label className="text-sm text-neutral-600">Required</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.showConditionally}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, showConditionally: checked })}
                />
                <label className="text-sm text-neutral-600">Show conditionally</label>
              </div>
            </div>
          </div>
        );

      case 'single_choice':
      case 'multiple_choice':
      case 'ranking':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Question Text
              </label>
              <Input
                value={value.title || ''}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Options
              </label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const updatedOptions = [...options];
                        updatedOptions[index] = e.target.value;
                        setOptions(updatedOptions);
                        onChange({ ...value, options: updatedOptions });
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveOption(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.required}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, required: checked })}
                />
                <label className="text-sm text-neutral-600">Required</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.showConditionally}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, showConditionally: checked })}
                />
                <label className="text-sm text-neutral-600">Show conditionally</label>
              </div>
            </div>
          </div>
        );

      case 'linear_scale':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Question Text
              </label>
              <Input
                value={value.title || ''}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                placeholder="Enter your question"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Start Value
                </label>
                <Input
                  type="number"
                  value={value.scaleConfig?.start || 1}
                  onChange={(e) => onChange({
                    ...value,
                    scaleConfig: {
                      ...value.scaleConfig,
                      start: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  End Value
                </label>
                <Input
                  type="number"
                  value={value.scaleConfig?.end || 5}
                  onChange={(e) => onChange({
                    ...value,
                    scaleConfig: {
                      ...value.scaleConfig,
                      end: parseInt(e.target.value)
                    }
                  })}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.required}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, required: checked })}
                />
                <label className="text-sm text-neutral-600">Required</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={value.showConditionally}
                  onCheckedChange={(checked: boolean) => onChange({ ...value, showConditionally: checked })}
                />
                <label className="text-sm text-neutral-600">Show conditionally</label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderQuestionConfig()}
    </div>
  );
} 