/**
 * Funciones helper para obtener textos de preguntas
 */

import { DEFAULT_QUESTIONS } from '../constants';

/**
 * Obtiene el texto de una pregunta por tipo
 * @param questionType - Tipo de pregunta (csat, ces, cv, etc.)
 * @returns Texto de la pregunta o string vacío
 */
export function getQuestionText(questionType: string): string {
  const question = DEFAULT_QUESTIONS.find(q => 
    q.id.toLowerCase().includes(questionType.toLowerCase())
  );
  return question ? (question.title || question.description) : '';
}

/**
 * Obtiene las instrucciones de una pregunta por tipo
 * @param questionType - Tipo de pregunta (nev, etc.)
 * @returns Instrucciones de la pregunta o descripción por defecto
 */
export function getQuestionInstructions(questionType: string): string {
  const question = DEFAULT_QUESTIONS.find(q => 
    q.id.toLowerCase().includes(questionType.toLowerCase())
  );
  return question ? (question.instructions || question.description) : '';
}

