import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import type { CognitiveTaskFormData, Question } from 'shared/interfaces/cognitive-task.interface';

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

// Constante para el estado inicial por defecto con las 8 preguntas originales (3.1-3.8)
export const DEFAULT_STATE: CognitiveTaskFormData = {
  researchId: '', // El researchId vendrá de props o se establecerá después
  questions: [
    {
      id: '3.1',
      type: 'short_text',
      title: '',
      description: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.2',
      type: 'long_text',
      title: '',
      required: false,
      showConditionally: false,
      deviceFrame: false,
      files: []
    },
    {
      id: '3.3',
      type: 'single_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.4',
      type: 'multiple_choice',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.5',
      type: 'linear_scale',
      title: '',
      required: false,
      showConditionally: false,
      scaleConfig: {
        startValue: 1,
        endValue: 5,
        startLabel: '',
        endLabel: ''
      },
      deviceFrame: false,
      files: []
    },
    {
      id: '3.6',
      type: 'ranking',
      title: '',
      required: false,
      showConditionally: false,
      choices: [
        { id: '1', text: '', isQualify: false, isDisqualify: false },
        { id: '2', text: '', isQualify: false, isDisqualify: false },
        { id: '3', text: '', isQualify: false, isDisqualify: false }
      ],
      deviceFrame: false,
      files: []
    },
    {
      id: '3.7',
      type: 'navigation_flow',
      title: '',
      required: false,
      showConditionally: false,
      files: [],
      deviceFrame: true
    },
    {
      id: '3.8',
      type: 'preference_test',
      title: '',
      description: '',
      required: false,
      showConditionally: false,
      files: [],
      deviceFrame: true
    }
  ],
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
    // 🎯 LOG TEMPORAL: Verificar que las hitZones lleguen aquí
    if (updates.files) {
      const filesWithHitZones = updates.files.filter((f: any) => f.hitZones && f.hitZones.length > 0);
      if (filesWithHitZones.length > 0) {
        console.log(`🎯 [useCognitiveTaskState] handleQuestionChange recibió ${filesWithHitZones.length} archivos con hitZones para pregunta ${questionId}`);
        filesWithHitZones.forEach((f: any, i: number) => {
          console.log(`🎯 [useCognitiveTaskState] Archivo ${i} (${f.name}) hitZones:`, f.hitZones);
        });
      }
    }

    setFormData(prevData => {
      const updatedQuestions = prevData.questions.map(q => {
        if (q.id === questionId) {
          return { ...q, ...updates };
        }
        return q;
      });

      // 🎯 LOG TEMPORAL: Verificar el estado después de la actualización
      const updatedQuestion = updatedQuestions.find(q => q.id === questionId);
      if (updatedQuestion?.files) {
        const filesWithHitZones = updatedQuestion.files.filter((f: any) => f.hitZones && f.hitZones.length > 0);
        if (filesWithHitZones.length > 0) {
          console.log(`🎯 [useCognitiveTaskState] Después de actualizar, pregunta ${questionId} tiene ${filesWithHitZones.length} archivos con hitZones`);
        }
      }

      return {
        ...prevData,
        questions: updatedQuestions
      };
    });
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
