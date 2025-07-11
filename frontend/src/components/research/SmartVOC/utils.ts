import { v4 as uuidv4 } from 'uuid';

import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from './types'; // Asegúrate que la ruta a types sea correcta

// Instala uuid si no lo has hecho: npm install uuid @types/uuid

export const generateNewQuestion = (index: number): SmartVOCQuestion => {
  const newId = uuidv4();
  return {
    id: newId,
    type: QuestionType.SMARTVOC_VOC,
    title: `Nueva Pregunta ${index + 1}`,
    description: '',
    showConditionally: false,
    config: {
      type: 'text'
    },
    instructions: ''
  };
};
