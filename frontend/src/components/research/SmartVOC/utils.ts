import { SmartVOCQuestion } from './types'; // Asegúrate que la ruta a types sea correcta
import { v4 as uuidv4 } from 'uuid';

// Instala uuid si no lo has hecho: npm install uuid @types/uuid

export const generateNewQuestion = (index: number): SmartVOCQuestion => {
  const newId = uuidv4(); 
  return {
    id: newId,
    type: 'VOC',
    title: `Nueva Pregunta ${index + 1}`,
    description: '',
    required: false,
    showConditionally: false,
    config: {},
    instructions: '' // Añadir si es parte del tipo
  };
}; 