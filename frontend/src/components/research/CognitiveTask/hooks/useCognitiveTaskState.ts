import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Question } from 'shared/interfaces/cognitive-task.interface';
import { CognitiveTaskFormData } from './useCognitiveTaskForm'; // Importar o definir localmente

// Definir localmente si no se exporta
// interface CognitiveTaskFormData { ... }

// Interfaz para las props del hook de estado
interface UseCognitiveTaskStateProps {
  initialData?: Partial<CognitiveTaskFormData>; // Permitir datos iniciales
}

// Interfaz para el resultado del hook de estado
interface UseCognitiveTaskStateResult {
  formData: CognitiveTaskFormData;
  setFormData: Dispatch<SetStateAction<CognitiveTaskFormData>>;
  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleRandomizeChange: (checked: boolean) => void;
}

// Constante para el estado inicial por defecto
const DEFAULT_STATE: CognitiveTaskFormData = {
  researchId: '', // El researchId vendrá de props o se establecerá después
  questions: [],
  randomizeQuestions: false
};

export const useCognitiveTaskState = ({
  initialData,
}: UseCognitiveTaskStateProps): UseCognitiveTaskStateResult => {
  const [formData, setFormData] = useState<CognitiveTaskFormData>(() => ({
    ...DEFAULT_STATE,
    ...(initialData || {}),
    questions: initialData?.questions || [], // Empezar siempre con datos iniciales o array vacío
  }));

  // Función para manejar cambios en preguntas
  const handleQuestionChange = useCallback((questionId: string, updates: Partial<Question>) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  }, []);

  // Función para agregar una opción a una pregunta
  const handleAddChoice = useCallback((questionId: string) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
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
    }));
  }, []);

  // Función para eliminar una opción de una pregunta
  const handleRemoveChoice = useCallback((questionId: string, choiceId: string) => {
    setFormData(prevData => ({
      ...prevData,
      questions: prevData.questions.map(q =>
        q.id === questionId && q.choices
          ? {
              ...q,
              choices: q.choices.filter(c => c.id !== choiceId)
            }
          : q
      )
    }));
  }, []);

  // Función para controlar el aleatorizado de preguntas
  const handleRandomizeChange = useCallback((checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      randomizeQuestions: checked
    }));
  }, []);

  return {
    formData,
    setFormData,
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleRandomizeChange,
  };
}; 