import React from 'react';
import { render, screen } from '@testing-library/react';
import { TextQuestion } from './TextQuestion';
import { Question } from '../../types';

// Mock de la característica de input
jest.mock('@/components/ui/Input', () => ({
  Input: ({ value, onChange }: any) => (
    <input
      data-testid="mock-input"
      value={value}
      onChange={onChange}
    />
  ),
}));

// Mock de la característica de textarea
jest.mock('@/components/ui/Textarea', () => ({
  Textarea: ({ value, onChange }: any) => (
    <textarea
      data-testid="mock-textarea"
      value={value}
      onChange={onChange}
    />
  ),
}));

describe('TextQuestion', () => {
  const mockQuestion: Question = {
    id: '1',
    type: 'short_text',
    title: 'Test Question',
    required: true,
    showConditionally: false,
    deviceFrame: false
  };

  const mockProps = {
    question: mockQuestion,
    onQuestionChange: jest.fn(),
    validationErrors: {},
    disabled: false
  };

  it('renderiza el componente correctamente', () => {
    render(<TextQuestion {...mockProps} />);
    expect(screen.getByTestId('mock-input')).toBeInTheDocument();
    expect(screen.getByTestId('mock-textarea')).toBeInTheDocument();
  });
}); 