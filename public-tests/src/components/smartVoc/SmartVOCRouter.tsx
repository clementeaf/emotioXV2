import React, { useState, useCallback } from 'react';
// --- Importar Interfaces Compartidas --- 
import { 
    SmartVOCFormData, 
    SmartVOCQuestion, 
    ConfigScale, 
    ConfigCSAT, 
    ConfigNEV, 
    ConfigVOC 
} from '../../../shared/interfaces/smart-voc.interface';
// Quitar la importación de interfaces definidas localmente antes
// export { SmartVOCQuestion, ConfigScale, ConfigCSAT, ConfigNEV, ConfigVOC }; 

// --- Interfaz de Props Actualizada --- 
interface SmartVOCRouterProps {
  researchId: string; 
  stepId: string; // ID del paso general
  title?: string; // Título del paso general
  instructions?: string; // Instrucciones del paso general
  stepConfig: SmartVOCFormData; // La configuración específica parseada (contiene questions)
  onComplete: (answers: Record<string, any>) => void; 
  onError: (error: string) => void; 
}

// --- Componentes de Preguntas (Importaciones) ---
import { ScaleQuestion } from './questions/ScaleQuestion'; 
import { CSATQuestion } from './questions/CSATQuestion'; 
import { NEVQuestion } from './questions/NEVQuestion'; 
import { VOCTextQuestion } from './questions/VOCTextQuestion'; 

// --- Componente Principal SmartVOCRouter --- 

export const SmartVOCRouter: React.FC<SmartVOCRouterProps> = ({ 
    researchId, 
    stepId, 
    title, 
    instructions, 
    stepConfig, 
    onComplete, 
    onError 
}) => {

  console.log('[SmartVOCRouter] Received Props:', { researchId, stepId, title, instructions, stepConfig });

  const [answers, setAnswers] = useState<Record<string, any>>({}); 
  const [errors, setErrors] = useState<Record<string, string>>({}); 

  // Callback para actualizar una respuesta (usa questionId directamente)
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: answer
    }));
    if (errors[questionId]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  }, [errors]);

  // Función para validar el formulario (usa stepConfig.questions)
  const validateForm = (): boolean => {
    const validationErrors: Record<string, string> = {};
    let isValid = true;
    // Asegurarse de que stepConfig y stepConfig.questions existen
    if (!stepConfig?.questions) {
        onError('Error interno: No se encontraron preguntas en la configuración.');
        return false;
    }
    stepConfig.questions.forEach(question => {
      if (question.required && (answers[question.id] === undefined || answers[question.id] === null || answers[question.id] === '')) {
        validationErrors[question.id] = 'Esta pregunta es obligatoria.';
        isValid = false;
      }
    });
    setErrors(validationErrors);
    return isValid;
  };

  // Manejar el clic en "Siguiente" (sin cambios)
  const handleCompleteClick = () => {
    if (validateForm()) {
      console.log('[SmartVOCRouter] Formulario válido. Respuestas:', answers);
      onComplete(answers); 
    } else {
      console.warn('[SmartVOCRouter] Formulario inválido. Errores:', errors);
    }
  };

  // --- Renderizado --- 

  // Validar que stepConfig y questions existen
  if (!stepConfig || !Array.isArray(stepConfig.questions)) {
     onError("Error interno: Configuración inválida o faltan preguntas para SmartVOC.");
     return <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded">Error configuración.</div>;
  }

  // Usar title e instructions de props, y questions de stepConfig
  const questionsToRender = stepConfig.questions;
  // TODO: Manejar stepConfig.randomizeQuestions 

  return (
    <div className="p-4 md:p-6 border rounded shadow-md w-full max-w-3xl flex flex-col space-y-6">
      <div>
          {/* Usar title y instructions recibidos como props */}
          <h2 className="text-xl md:text-2xl font-bold mb-2">{title || 'Encuesta Rápida'}</h2>
          {instructions && <p className="text-sm md:text-base text-gray-600 mb-4">{instructions}</p>}
      </div>
      
      {/* Iterar y renderizar cada pregunta de questionsToRender */}
      <div className="space-y-8">
          {questionsToRender.map((question, index) => {
              // ... (lógica del switch para QuestionComponent sin cambios, asume que las interfaces importadas son compatibles)
              let QuestionComponent;
              switch (question.type) {
                  case 'CSAT':
                      QuestionComponent = CSATQuestion;
                      break;
                  case 'CES':
                  case 'CV':
                  case 'NPS': 
                      // Asegurarnos de que el componente ScaleQuestion es compatible con SmartVOCQuestion
                      QuestionComponent = ScaleQuestion; 
                      break;
                  case 'NEV': 
                      QuestionComponent = NEVQuestion;
                      break;
                  case 'VOC': 
                      QuestionComponent = VOCTextQuestion;
                      break;
                  default:
                       return (
                            <div key={question.id || index} className="p-4 bg-red-50 border border-red-200 rounded">
                                <p className="font-semibold text-red-700">Error: Tipo de pregunta no soportado '{question.type}'</p>
                                <pre className="text-xs text-red-600 mt-2">{JSON.stringify(question, null, 2)}</pre>
                            </div>
                       );
              }

              return (
                  <div key={question.id || index} className={`p-4 border rounded-lg shadow-sm ${errors[question.id] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                      <QuestionComponent 
                          // Pasar la question completa como questionConfig al componente hijo
                          questionConfig={question as any} // Usar 'as any' temporalmente si hay incompatibilidad leve
                          value={answers[question.id]} 
                          onChange={handleAnswerChange}
                      />
                      {errors[question.id] && <p className="text-xs text-red-600 mt-1">{errors[question.id]}</p>}
                  </div>
              );
          })}
      </div>

      {/* Botón para completar el paso (sin cambios) */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
          <button 
            onClick={handleCompleteClick} 
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Siguiente
          </button>
      </div>
    </div>
  );
}; 