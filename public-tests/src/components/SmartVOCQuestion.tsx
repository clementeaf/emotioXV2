import React, { useState, useEffect } from 'react';
import { ExpandedStep } from '../stores/participantStore';
import { useParticipantStore } from '../stores/participantStore';

interface SmartVOCQuestionProps {
  question: ExpandedStep;
  onComplete: (answer: any) => void;
  isAnswered?: boolean;
}

const SmartVOCQuestion: React.FC<SmartVOCQuestionProps> = ({ 
  question, 
  onComplete, 
  isAnswered = false 
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  
  // Acceder a la función para forzar guardado
  const forceSaveToLocalStorage = useParticipantStore(state => state.forceSaveToLocalStorage);
  
  // Configuraciones según el tipo
  const getVOCConfig = () => {
    const type = question.type.split('_')[1]?.toUpperCase();
    
    switch (type) {
      case 'CSAT':
        return {
          title: 'Satisfacción del Cliente',
          min: 1,
          max: 5,
          minLabel: 'Muy insatisfecho',
          maxLabel: 'Muy satisfecho',
          showFeedback: true
        };
      case 'CES':
        return {
          title: 'Esfuerzo del Cliente',
          min: 1,
          max: 7,
          minLabel: 'Muy difícil',
          maxLabel: 'Muy fácil',
          showFeedback: true
        };
      case 'NPS':
        return {
          title: 'Net Promoter Score',
          min: 0,
          max: 10,
          minLabel: 'Nada probable',
          maxLabel: 'Extremadamente probable',
          showFeedback: true
        };
      case 'CV':
        return {
          title: 'Valor para el Cliente',
          min: 1,
          max: 10,
          minLabel: 'Poco valor',
          maxLabel: 'Mucho valor',
          showFeedback: true
        };
      case 'NEV':
        return {
          title: 'Valor Emocional Neto',
          min: -5,
          max: 5,
          minLabel: 'Muy negativo',
          maxLabel: 'Muy positivo',
          showFeedback: true
        };
      case 'FEEDBACK':
        return {
          title: 'Comentarios',
          min: 0,
          max: 0,
          minLabel: '',
          maxLabel: '',
          showFeedback: true,
          feedbackOnly: true
        };
      default:
        return {
          title: 'Valoración',
          min: 1,
          max: 5,
          minLabel: 'Bajo',
          maxLabel: 'Alto',
          showFeedback: true
        };
    }
  };
  
  const config = {
    ...getVOCConfig(),
    ...question.config // Sobrescribir con las configuraciones específicas de la pregunta
  };
  
  // Forzar guardado al montar componente
  useEffect(() => {
    forceSaveToLocalStorage();
    
    // Intentar cargar respuestas temporales
    try {
      const tempResponse = localStorage.getItem(`temp_smartvoc_${question.id}`);
      if (tempResponse && !isAnswered) {
        const parsed = JSON.parse(tempResponse);
        console.log(`[SmartVOC] Encontrada respuesta temporal para ${question.id}`, parsed);
        
        if (parsed.answer) {
          if ('value' in parsed.answer) {
            setRating(parsed.answer.value);
          }
          if ('feedback' in parsed.answer) {
            setFeedback(parsed.answer.feedback);
          }
        }
      }
    } catch (err) {
      console.error("[SmartVOC] Error recuperando respuesta temporal:", err);
    }
  }, []);
  
  // Cargar respuestas guardadas
  useEffect(() => {
    if (isAnswered && question.config?.savedResponses) {
      const savedResponse = question.config.savedResponses;
      if (typeof savedResponse === 'object') {
        if ('value' in savedResponse) {
          setRating(savedResponse.value);
        }
        if ('feedback' in savedResponse) {
          setFeedback(savedResponse.feedback);
        }
      }
      
      // Forzar guardado cuando se carga una respuesta guardada
      forceSaveToLocalStorage();
      
      console.log(`[SmartVOC] Cargada respuesta guardada para ${question.id}`);
    }
  }, [isAnswered, question.config, forceSaveToLocalStorage, question.id]);
  
  // Guardar temporalmente cuando cambia la valoración
  useEffect(() => {
    if (isAnswered || rating === 0) return;
    
    // Guardar temporalmente la valoración
    try {
      localStorage.setItem(`temp_smartvoc_${question.id}`, JSON.stringify({
        stepId: question.id,
        stepType: question.type,
        answer: { value: rating, feedback, partial: true },
        timestamp: Date.now()
      }));
      console.log(`[SmartVOC] Guardada valoración temporal: ${rating}`);
    } catch (err) {
      console.error("[SmartVOC] Error guardando valoración temporal:", err);
    }
  }, [rating, isAnswered, question.id, question.type, feedback]);
  
  // Auto-guardar comentarios largos
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFeedback = e.target.value;
    setFeedback(newFeedback);
    
    // Auto-guardar comentarios largos
    if (newFeedback.length > 30 && !isAnswered) {
      try {
        localStorage.setItem(`temp_smartvoc_${question.id}`, JSON.stringify({
          stepId: question.id,
          stepType: question.type,
          answer: { value: rating, feedback: newFeedback, partial: true },
          timestamp: Date.now()
        }));
        console.log(`[SmartVOC] Auto-guardado comentario (${newFeedback.length} caracteres)`);
      } catch (err) {
        console.error("[SmartVOC] Error auto-guardando comentario:", err);
      }
    }
  };
  
  // Enviar respuesta
  const handleSubmit = () => {
    const result = {
      type: question.type,
      value: rating,
      feedback: feedback.trim() || undefined,
      timestamp: Date.now(),
      questionId: question.id
    };
    
    // Limpiar respuesta temporal
    try {
      localStorage.removeItem(`temp_smartvoc_${question.id}`);
    } catch (err) {
      console.error("[SmartVOC] Error limpiando respuesta temporal:", err);
    }
    
    // Guardar directamente en localStorage como respaldo
    try {
      localStorage.setItem(`smartvoc_response_${question.id}`, JSON.stringify({
        stepId: question.id,
        stepType: question.type,
        answer: result,
        timestamp: Date.now()
      }));
      console.log(`[SmartVOC] Respuesta guardada directamente para ${question.id}`);
    } catch (err) {
      console.error("[SmartVOC] Error en guardado directo:", err);
    }
    
    onComplete(result);
    
    // Forzar guardado completo después de completar
    setTimeout(() => forceSaveToLocalStorage(), 100);
  };
  
  // Auto-guardado periódico
  useEffect(() => {
    if (isAnswered) return;
    
    const autoSaveInterval = setInterval(() => {
      // Solo guardar si hay contenido
      if (rating !== 0 || (feedback && feedback.trim().length > 0)) {
        console.log(`[SmartVOC] Auto-guardando datos para ${question.id}`);
        
        try {
          localStorage.setItem(`auto_smartvoc_${question.id}`, JSON.stringify({
            stepId: question.id,
            stepType: question.type,
            answer: { value: rating, feedback, partial: true },
            timestamp: Date.now()
          }));
        } catch (err) {
          console.error("[SmartVOC] Error en auto-guardado:", err);
        }
        
        // También forzar guardado en el store cada cierto tiempo
        forceSaveToLocalStorage();
      }
    }, 15000); // Cada 15 segundos
    
    return () => clearInterval(autoSaveInterval);
  }, [isAnswered, rating, feedback, question.id, question.type, forceSaveToLocalStorage]);
  
  // Renderizar escala de valoración
  const renderRatingScale = () => {
    const ratings = [];
    for (let i = config.min; i <= config.max; i++) {
      ratings.push(i);
    }
    
    return (
      <div className="rating-scale" style={{ marginBottom: '1.5rem' }}>
        <div className="scale-labels" style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <span>{config.minLabel}</span>
          <span>{config.maxLabel}</span>
        </div>
        
        <div className="rating-buttons" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          gap: '4px' 
        }}>
          {ratings.map(value => (
            <button
              key={value}
              onClick={() => !isAnswered && setRating(value)}
              onMouseEnter={() => !isAnswered && setHoverRating(value)}
              onMouseLeave={() => !isAnswered && setHoverRating(0)}
              disabled={isAnswered}
              style={{
                flex: 1,
                padding: '0.75rem 0',
                border: `1px solid ${value === rating ? '#4caf50' : '#ddd'}`,
                backgroundColor: (() => {
                  if (isAnswered && value === rating) return '#e8f5e9';
                  if (!isAnswered && value === rating) return '#e8f5e9';
                  if (!isAnswered && value <= hoverRating) return '#f1f8e9';
                  return 'white';
                })(),
                borderRadius: '4px',
                cursor: isAnswered ? 'default' : 'pointer',
                fontWeight: value === rating ? 'bold' : 'normal'
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="smartvoc-question" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>
        {question.name || config.title}
      </h2>
      
      <div className="question-text" style={{ 
        fontSize: '1.1rem', 
        marginBottom: '1.5rem'
      }}>
        {question.config?.questionText || "¿Cómo valorarías tu experiencia?"}
      </div>
      
      {/* Escala de valoración (excepto para feedback puro) */}
      {!config.feedbackOnly && renderRatingScale()}
      
      {/* Campo de comentarios */}
      {config.showFeedback && (
        <div className="feedback-container" style={{ marginBottom: '1.5rem' }}>
          <label 
            htmlFor="feedback" 
            style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: 'bold' 
            }}>
            {config.feedbackLabel || "¿Tienes algún comentario adicional?"}
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={handleFeedbackChange}
            disabled={isAnswered}
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '1rem'
            }}
          />
        </div>
      )}
      
      {/* Botón de envío */}
      {!isAnswered && (
        <button
          onClick={handleSubmit}
          disabled={config.feedbackOnly ? !feedback.trim() : !rating}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            opacity: (config.feedbackOnly ? !feedback.trim() : !rating) ? 0.7 : 1
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
          Valoración guardada
        </div>
      )}
    </div>
  );
};

export default SmartVOCQuestion; 