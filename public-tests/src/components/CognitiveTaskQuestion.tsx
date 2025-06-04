import React, { useState, useEffect, useCallback } from 'react';
import { ExpandedStep } from '../stores/participantStore';
import { useParticipantStore } from '../stores/participantStore';
import { useResponseStorage } from '../hooks/useResponseStorage';

interface CognitiveTaskQuestionProps {
  question: ExpandedStep;
  onComplete: (answer: unknown) => void;
  isAnswered?: boolean;
}

const CognitiveTaskQuestion: React.FC<CognitiveTaskQuestionProps> = ({ 
  question, 
  onComplete, 
  isAnswered = false 
}) => {
  const [answer, setAnswer] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  
  const timeLimit = typeof question.config === 'object' && question.config !== null && 'timeLimit' in question.config && typeof (question.config as { timeLimit?: unknown }).timeLimit === 'number'
    ? (question.config as { timeLimit: number }).timeLimit
    : 60;
  
  const forceSaveToLocalStorage = useParticipantStore(state => state.forceSaveToLocalStorage);
  const { saveResponse, loadResponse, clearResponse } = useResponseStorage();
  
  // Obtener tipo específico de pregunta cognitiva
  const getCognitiveType = () => {
    if (question.type.includes('open')) return 'Pregunta abierta';
    if (question.type.includes('closed')) return 'Pregunta cerrada';
    if (question.type.includes('multiplechoice')) return 'Selección múltiple';
    if (question.type.includes('text')) return 'Texto';
    if (question.type.includes('image')) return 'Imagen';
    return 'Tarea cognitiva';
  };
  
  // Cargar respuesta guardada al montar el componente
  useEffect(() => {
    if (!isAnswered) {
      const savedResponse = loadResponse(question.id);
      if (savedResponse && savedResponse.answer) {
        const answerData = savedResponse.answer as { text?: string; option?: string };
        if (answerData.text) {
          setAnswer(answerData.text);
        } else if (answerData.option) {
          setSelected(answerData.option);
        }
      }
    }
  }, [question.id, isAnswered, loadResponse]);
  
  // Manejar cambios en la respuesta de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAnswer(newValue);
    
    // Guardar automáticamente para textos largos
    if (newValue.length > 50) {
      saveResponse(question.id, question.type, { text: newValue, timeLeft: timeLimit }, true);
    }
  };

  // Manejar selección de opción
  const handleOptionSelect = (option: string) => {
    setSelected(option);
    // Guardar selección inmediatamente
    saveResponse(question.id, question.type, { option, timeLeft: timeLimit }, true);
  };
  
  // Enviar respuesta final
  const handleSubmit = useCallback(() => {
    const result = question.type.includes('multiplechoice') 
      ? { option: selected, timeLeft: timeLimit }
      : { text: answer, timeLeft: timeLimit };
    
    // Limpiar respuesta temporal y guardar definitiva
    clearResponse(question.id);
    onComplete(result);
    
    // Forzar guardado en el store
    setTimeout(() => forceSaveToLocalStorage(), 100);
  }, [answer, selected, timeLimit, question, onComplete, forceSaveToLocalStorage, clearResponse]);
  
  // Renderizar opciones múltiples
  const renderMultipleChoice = () => {
    let options: string[] = ['Opción 1', 'Opción 2', 'Opción 3'];
    if (question.config && typeof question.config === 'object' && 'options' in question.config && Array.isArray((question.config as { options?: unknown }).options)) {
      options = (question.config as { options: unknown[] }).options.filter((opt): opt is string => typeof opt === 'string');
    }
    
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
    const isMultiline = question.config && typeof question.config === 'object' && 'multiline' in question.config && Boolean((question.config as { multiline?: unknown }).multiline);
    
    const inputStyle = {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '4px',
      border: '1px solid #ccc',
      fontSize: '1rem',
      marginBottom: '1.5rem'
    };
    
    return isMultiline ? (
      <textarea
        value={answer}
        onChange={handleTextChange}
        disabled={isAnswered}
        style={{ ...inputStyle, minHeight: '150px' }}
      />
    ) : (
      <input
        type="text"
        value={answer}
        onChange={handleTextChange}
        disabled={isAnswered}
        style={inputStyle}
      />
    );
  };
  
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
        
        {/* Mostrar temporizador si está configurado */}
        {question.config && typeof question.config === 'object' && 'timeLimit' in question.config && (
          <div className="timer" style={{
            backgroundColor: timeLimit < 10 ? '#ffebee' : '#f5f5f5',
            color: timeLimit < 10 ? '#c62828' : '#333',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}>
            {timeLimit}s
          </div>
        )}
      </div>
      
      {/* Imagen si existe */}
      {question.config && typeof question.config === 'object' && 'imageUrl' in question.config && (
        <div className="image-container" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <img 
            src={(question.config as { imageUrl: string }).imageUrl} 
            alt={
              'imageAlt' in question.config && typeof (question.config as { imageAlt?: unknown }).imageAlt === 'string'
                ? (question.config as { imageAlt: string }).imageAlt
                : "Estímulo visual"
            } 
            style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #eee' }} 
          />
        </div>
      )}
      
      {/* Pregunta */}
      <div className="question-text" style={{ 
        fontSize: '1.1rem', 
        marginBottom: '1.5rem',
        fontWeight: question.config && typeof question.config === 'object' && 'highlight' in question.config && Boolean((question.config as { highlight?: unknown }).highlight) ? 'bold' : 'normal',
        backgroundColor: question.config && typeof question.config === 'object' && 'highlight' in question.config && Boolean((question.config as { highlight?: unknown }).highlight) ? '#fffde7' : 'transparent',
        padding: question.config && typeof question.config === 'object' && 'highlight' in question.config && Boolean((question.config as { highlight?: unknown }).highlight) ? '1rem' : '0'
      }}>
        {question.config && typeof question.config === 'object' && 'questionText' in question.config && typeof (question.config as { questionText?: unknown }).questionText === 'string'
          ? (question.config as { questionText: string }).questionText
          : "¿Cuál es tu respuesta?"}
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