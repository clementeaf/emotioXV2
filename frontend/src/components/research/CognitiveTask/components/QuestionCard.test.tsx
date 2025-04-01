import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';
import { Question } from '../types';

// Mock de los componentes de preguntas
jest.mock('./questions/TextQuestion', () => ({
  TextQuestion: () => <div data-testid="mock-text-question">Text Question</div>
}));

jest.mock('./questions/ChoiceQuestion', () => ({
  ChoiceQuestion: () => <div data-testid="mock-choice-question">Choice Question</div>
}));

jest.mock('./questions/ScaleQuestion', () => ({
  ScaleQuestion: () => <div data-testid="mock-scale-question">Scale Question</div>
}));

jest.mock('./questions/FileUploadQuestion', () => ({
  FileUploadQuestion: () => <div data-testid="mock-file-question">File Question</div>
}));

// Mock del componente Switch
jest.mock('@/components/ui/Switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid="mock-switch"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

describe('QuestionCard', () => {
  const baseProps = {
    onQuestionChange: jest.fn(),
    onAddChoice: jest.fn(),
    onRemoveChoice: jest.fn(),
    onFileUpload: jest.fn(),
    disabled: false,
    validationErrors: {}
  };

  it('renderiza el componente TextQuestion para preguntas de texto', () => {
    const question: Question = {
      id: '1',
      type: 'short_text',
      title: 'Text Question',
      required: true,
      showConditionally: false,
      deviceFrame: false
    };

    render(<QuestionCard {...baseProps} question={question} />);
    expect(screen.getByTestId('mock-text-question')).toBeInTheDocument();
  });

  it('renderiza el componente ChoiceQuestion para preguntas de opción', () => {
    const question: Question = {
      id: '2',
      type: 'single_choice',
      title: 'Choice Question',
      required: true,
      showConditionally: false,
      deviceFrame: false,
      choices: [{ id: '1', text: 'Option 1' }]
    };

    render(<QuestionCard {...baseProps} question={question} />);
    expect(screen.getByTestId('mock-choice-question')).toBeInTheDocument();
  });

  it('renderiza el componente ScaleQuestion para preguntas de escala', () => {
    const question: Question = {
      id: '3',
      type: 'linear_scale',
      title: 'Scale Question',
      required: true,
      showConditionally: false,
      deviceFrame: false,
      scaleConfig: {
        startValue: 1,
        endValue: 5
      }
    };

    render(<QuestionCard {...baseProps} question={question} />);
    expect(screen.getByTestId('mock-scale-question')).toBeInTheDocument();
  });

  it('renderiza el componente FileUploadQuestion para preguntas de archivos', () => {
    const question: Question = {
      id: '4',
      type: 'navigation_flow',
      title: 'File Question',
      required: true,
      showConditionally: false,
      deviceFrame: false,
      files: []
    };

    render(<QuestionCard {...baseProps} question={question} />);
    expect(screen.getByTestId('mock-file-question')).toBeInTheDocument();
  });
}); 