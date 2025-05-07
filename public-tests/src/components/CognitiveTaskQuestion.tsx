import React, { useState, useEffect } from 'react';
import { ExpandedStep } from '../stores/participantStore';
import { useParticipantStore } from '../stores/participantStore';

interface CognitiveTaskQuestionProps {
  question: ExpandedStep;
  onComplete: (answer: any) => void;
  isAnswered?: boolean;
}

const CognitiveTaskQuestion: React.FC<CognitiveTaskQuestionProps> = ({ 
  question, 
  onComplete, 
  isAnswered = false 
}) => {
  const [answer, setAnswer] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(question.config?.timeLimit || 60);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  
  // Acceder a la función para forzar guardado
  const forceSaveToLocalStorage = useParticipantStore(state => state.forceSaveToLocalStorage);
  
  // Obtener tipo específico de pregunta cognitiva
  const getCognitiveType = () => {
    if (question.type.includes('open')) return 'Pregunta abierta';
    if (question.type.includes('closed')) return 'Pregunta cerrada';
    if (question.type.includes('multiplechoice')) return 'Selección múltiple';
    if (question.type.includes('text')) return 'Texto';
    if (question.type.includes('image')) return 'Imagen';
    return 'Tarea cognitiva';
  };
  
  // Manejar temporizador
  useEffect(() => {
    if (!isTimerActive || isAnswered) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerActive(false);
          // Auto-enviar al acabar el tiempo
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTimerActive, isAnswered]);
  
  // Iniciar temporizador al montar
  useEffect(() => {
    if (!isAnswered && !isTimerActive && question.config?.timeLimit) {
      setIsTimerActive(true);
    }
    
    // Forzar guardado al montar componente
    forceSaveToLocalStorage();
  }, []);
  
  // Cargar respuestas guardadas
  useEffect(() => {
    if (isAnswered && question.config?.savedResponses) {
      const savedAnswer = question.config.savedResponses;
      if (typeof savedAnswer === 'object' && savedAnswer.text) {
        setAnswer(savedAnswer.text);
      } else if (typeof savedAnswer === 'object' && savedAnswer.option) {
        setSelected(savedAnswer.option);
      } else if (typeof savedAnswer === 'string') {
        setAnswer(savedAnswer);
      }
      
      // Forzar guardado cuando se carga una respuesta guardada
      forceSaveToLocalStorage();
      
      console.log(`[CognitiveTask] Cargada respuesta guardada para ${question.id}`);
    }
  }, [isAnswered, question.config, forceSaveToLocalStorage, question.id]);
  
  // Manejar cambios en la respuesta de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    
    // Guardar automáticamente con cada cambio si es texto largo
    if (e.target.value.length > 50 && question.type.includes('text')) {
      // Guardar temporalmente durante la edición
      try {
        localStorage.setItem(`temp_response_${question.id}`, JSON.stringify({
          stepId: question.id,
          stepType: question.type,
          answer: { text: e.target.value, timeLeft, partial: true },
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error("[CognitiveTask] Error guardando respuesta temporal:", err);
      }
    }
  };
  
  // Manejar selección de opción
  const handleOptionSelect = (option: string) => {
    setSelected(option);
    
    // Guardar temporalmente durante la selección
    try {
      localStorage.setItem(`temp_response_${question.id}`, JSON.stringify({
        stepId: question.id,
        stepType: question.type,
        answer: { option, timeLeft, partial: true },
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error("[CognitiveTask] Error guardando selección temporal:", err);
    }
  };
  
  // Enviar respuesta
  const handleSubmit = () => {
    let result: any = {};
    
    if (question.type.includes('multiplechoice')) {
      result = { option: selected, timeLeft };
    } else {
      result = { text: answer, timeLeft };
    }
    
    // Añadir metadatos para la persistencia
    result.timestamp = Date.now();
    result.questionId = question.id;
    result.questionType = question.type;
    
    // Limpiar respuesta temporal
    try {
      localStorage.removeItem(`temp_response_${question.id}`);
    } catch (err) {
      console.error("[CognitiveTask] Error limpiando respuesta temporal:", err);
    }
    
    // Guardar directamente en localStorage como respaldo
    try {
      localStorage.setItem(`cognitive_response_${question.id}`, JSON.stringify({
        stepId: question.id,
        stepType: question.type,
        answer: result,
        timestamp: Date.now()
      }));
      console.log(`[CognitiveTask] Respuesta guardada directamente para ${question.id}`);
    } catch (err) {
      console.error("[CognitiveTask] Error en guardado directo:", err);
    }
    
    onComplete(result);
    
    // Forzar guardado completo después de completar
    setTimeout(() => forceSaveToLocalStorage(), 100);
  };
  
  // Comprobar si hay respuesta temporal guardada para recuperar
  useEffect(() => {
    if (!isAnswered && !answer && !selected) {
      try {
        const tempResponse = localStorage.getItem(`temp_response_${question.id}`);
        if (tempResponse) {
          const parsed = JSON.parse(tempResponse);
          console.log(`[CognitiveTask] Encontrada respuesta temporal para ${question.id}`, parsed);
          
          if (parsed.answer) {
            if (parsed.answer.text) {
              setAnswer(parsed.answer.text);
            } else if (parsed.answer.option) {
              setSelected(parsed.answer.option);
            }
          }
        }
      } catch (err) {
        console.error("[CognitiveTask] Error recuperando respuesta temporal:", err);
      }
    }
  }, [question.id, isAnswered, answer, selected]);
  
  // Renderizar opciones múltiples
  const renderMultipleChoice = () => {
    const options = question.config?.options || ['Opción 1', 'Opción 2', 'Opción 3'];
    
    return (
      <div className="options-container" style={{ marginBottom: '1.5rem' }}>
        {options.map((option: string, index: number) => (
          <div 
            key={index} 
            className="option"
            style={{
              padding: '0.75rem',
              marginBottom: '0.5rem',
              border: `1px solid ${selected === option ? '#4caf50' : '#ddd'}`,
              borderRadius: '4px',
              backgroundColor: selected === option ? '#e8f5e9' : 'white',
              cursor: isAnswered ? 'default' : 'pointer'
            }}
            onClick={() => !isAnswered && handleOptionSelect(option)}
          >
            {option}
          </div>
        ))}
      </div>
    );
  };
  
  // Renderizar entrada de texto
  const renderTextInput = () => {
    const isMultiline = question.config?.multiline || false;
    
    return isMultiline ? (
      <textarea
        value={answer}
        onChange={handleTextChange}
        disabled={isAnswered}
        style={{
          width: '100%',
          minHeight: '150px',
          padding: '0.75rem',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}
      />
    ) : (
      <input
        type="text"
        value={answer}
        onChange={handleTextChange}
        disabled={isAnswered}
        style={{
          width: '100%',
          padding: '0.75rem',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '1rem',
          marginBottom: '1.5rem'
        }}
      />
    );
  };
  
  // Guardar datos cada 10 segundos como respaldo
  useEffect(() => {
    if (isAnswered) return;
    
    const autoSaveInterval = setInterval(() => {
      // Solo guardar si hay contenido
      if ((answer && answer.trim().length > 0) || selected) {
        console.log(`[CognitiveTask] Auto-guardando datos para ${question.id}`);
        
        const currentAnswer = question.type.includes('multiplechoice')
          ? { option: selected, timeLeft, partial: true }
          : { text: answer, timeLeft, partial: true };
        
        try {
          localStorage.setItem(`auto_response_${question.id}`, JSON.stringify({
            stepId: question.id,
            stepType: question.type,
            answer: currentAnswer,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error("[CognitiveTask] Error en auto-guardado:", err);
        }
      }
    }, 10000); // Cada 10 segundos
    
    return () => clearInterval(autoSaveInterval);
  }, [isAnswered, answer, selected, question.id, question.type, timeLeft]);
  
  return (
    <div className="cognitive-task" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <div className="header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h2>{question.name || getCognitiveType()}</h2>
        
        {/* Mostrar temporizador si está activo */}
        {question.config?.timeLimit && (
          <div className="timer" style={{
            backgroundColor: timeLeft < 10 ? '#ffebee' : '#f5f5f5',
            color: timeLeft < 10 ? '#c62828' : '#333',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {timeLeft}s
          </div>
        )}
      </div>
      
      {/* Imagen si existe */}
      {question.config?.imageUrl && (
        <div className="image-container" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <img 
            src={question.config.imageUrl} 
            alt={question.config.imageAlt || "Estímulo visual"} 
            style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #eee' }} 
          />
        </div>
      )}
      
      {/* Pregunta */}
      <div className="question-text" style={{ 
        fontSize: '1.1rem', 
        marginBottom: '1.5rem',
        fontWeight: question.config?.highlight ? 'bold' : 'normal',
        backgroundColor: question.config?.highlight ? '#fffde7' : 'transparent',
        padding: question.config?.highlight ? '1rem' : '0'
      }}>
        {question.config?.questionText || "¿Cuál es tu respuesta?"}
      </div>
      
      {/* Respuestas */}
      {question.type.includes('multiplechoice') ? renderMultipleChoice() : renderTextInput()}
      
      {/* Botón de envío */}
      {!isAnswered && (
        <button
          onClick={handleSubmit}
          disabled={question.type.includes('multiplechoice') ? !selected : !answer.trim()}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            opacity: (question.type.includes('multiplechoice') ? !selected : !answer.trim()) ? 0.7 : 1
          }}
        >
          Enviar respuesta
        </button>
      )}
      
      {/* Mensaje de respuesta guardada */}
      {isAnswered && (
        <div style={{
          backgroundColor: '#e8f5e9',
          color: '#2e7d32',
          padding: '0.75rem',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          Respuesta guardada
        </div>
      )}
    </div>
  );
};

export default CognitiveTaskQuestion; 