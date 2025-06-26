import { ChoiceQuestionData } from './components';

// Datos para la pregunta de opción única (Single Choice)
export const singleChoiceQuestionData: ChoiceQuestionData = {
  question: 'the question asked to the user in the test',
  options: [
    { id: '1', text: 'Answer 01', percentage: 70 },
    { id: '2', text: 'Answer 02', percentage: 10 },
    { id: '3', text: 'Answer 03', percentage: 20 }
  ],
  totalResponses: 28635,
  responseDuration: '26s'
};

// Datos para la pregunta de opción múltiple (Multiple Choice)
export const multipleChoiceQuestionData: ChoiceQuestionData = {
  question: 'the question asked to the user in the test',
  options: [
    { id: '1', text: 'Answer 01', percentage: 70 },
    { id: '2', text: 'Answer 02', percentage: 10 },
    { id: '3', text: 'Answer 03', percentage: 20 }
  ],
  totalResponses: 28635,
  responseDuration: '26s'
};

// Datos para la pregunta de escala lineal (Linear Scale)
export const linearScaleQuestionData: ChoiceQuestionData = {
  question: 'This was the best app my eyes had see',
  options: [
    { id: '1', text: 'Option 01', percentage: 70, color: 'red' },
    { id: '2', text: 'Option 02', percentage: 10, color: 'red' },
    { id: '3', text: 'Option 03', percentage: 20, color: 'gray' },
    { id: '4', text: 'Option 04', percentage: 20, color: 'green' },
    { id: '5', text: 'Option 05', percentage: 20, color: 'green' }
  ],
  totalResponses: 28635,
  responseDuration: '26s'
}; 