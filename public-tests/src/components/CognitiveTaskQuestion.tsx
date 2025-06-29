import React, { useCallback, useEffect, useState } from 'react';
// import { ExpandedStep } from '../stores/participantStore';
import { useResponseStorage } from '../hooks/useResponseStorage';
import { useStepTimeout } from '../hooks/useStepTimeout';
import { useStepTimeoutConfig } from '../hooks/useStepTimeoutConfig';
import { CognitiveTaskQuestionProps } from '../types/cognitive-task.types';
import { StepTimeoutDisplay } from './common/StepTimeoutDisplay';

const CognitiveTaskQuestion: React.FC<CognitiveTaskQuestionProps> = ({
  cognitiveQuestion,
  onComplete,
  isAnswered = false
}) => {
  const [answer, setAnswer] = useState<string>('');
  const [selected, setSelected] = useState<string>('');

  // Extraer configuración de timeout
  const timeoutConfig = useStepTimeoutConfig(cognitiveQuestion.config);

  // Hook de timeout
  const timeoutState = useStepTimeout(
    timeoutConfig,
    () => {
      console.log('[CognitiveTaskQuestion] Timeout ejecutado');
      // Auto-submit con datos por defecto si está configurado
      if (timeoutConfig.autoSubmit) {
        const result = cognitiveQuestion.type.includes('multiplechoice')
          ? { option: selected || 'timeout', timeLeft: 0, timeoutExpired: true }
          : { text: answer || 'Sin respuesta', timeLeft: 0, timeoutExpired: true };
        onComplete(result);
      }
    },
    () => {
      console.log('[CognitiveTaskQuestion] Warning ejecutado');
    }
  );

  const { saveResponse, loadResponse, clearResponse } = useResponseStorage();

  // Obtener tipo específico de pregunta cognitiva
  const getCognitiveType = () => {
    if (cognitiveQuestion.type.includes('open')) return 'Pregunta abierta';
    if (cognitiveQuestion.type.includes('closed')) return 'Pregunta cerrada';
    if (cognitiveQuestion.type.includes('multiplechoice')) return 'Selección múltiple';
    if (cognitiveQuestion.type.includes('text')) return 'Texto';
    if (cognitiveQuestion.type.includes('image')) return 'Imagen';
    return 'Tarea cognitiva';
  };

  // Cargar respuesta guardada al montar el componente
  useEffect(() => {
    if (!isAnswered) {
      const savedResponse = loadResponse(cognitiveQuestion.id);
      if (savedResponse && savedResponse.answer) {
        const answerData = savedResponse.answer as { text?: string; option?: string };
        if (answerData.text) {
          setAnswer(answerData.text);
        } else if (answerData.option) {
          setSelected(answerData.option);
        }
      }
    }
  }, [cognitiveQuestion.id, isAnswered, loadResponse]);

  // Iniciar timeout automáticamente
  useEffect(() => {
    if (timeoutConfig.enabled && !isAnswered) {
      timeoutState.startTimeout();
    }

    return () => {
      timeoutState.resetTimeout();
    };
  }, [timeoutConfig.enabled, isAnswered]);

  // Manejar cambios en la respuesta de texto
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAnswer(newValue);

    // Guardar automáticamente para textos largos
    if (newValue.length > 50) {
      saveResponse(cognitiveQuestion.id, cognitiveQuestion.type, {
        text: newValue,
        timeLeft: timeoutState.timeRemaining
      }, true);
    }
  };

  // Manejar selección de opción
  const handleOptionSelect = (option: string) => {
    setSelected(option);
    // Guardar selección inmediatamente
    saveResponse(cognitiveQuestion.id, cognitiveQuestion.type, {
      option,
      timeLeft: timeoutState.timeRemaining
    }, true);
  };

  // Enviar respuesta final
  const handleSubmit = useCallback(() => {
    const result = cognitiveQuestion.type.includes('multiplechoice')
      ? { option: selected, timeLeft: timeoutState.timeRemaining }
      : { text: answer, timeLeft: timeoutState.timeRemaining };

    // Limpiar respuesta temporal y guardar definitiva
    clearResponse(cognitiveQuestion.id);
    timeoutState.resetTimeout();
    onComplete(result);
  }, [answer, selected, timeoutState, cognitiveQuestion, onComplete, clearResponse]);

  // Renderizar opciones múltiples
  const renderMultipleChoice = () => {
    let options: string[] = ['Opción 1', 'Opción 2', 'Opción 3'];
    if (cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'options' in cognitiveQuestion.config && Array.isArray((cognitiveQuestion.config as { options?: unknown }).options)) {
      options = (cognitiveQuestion.config as { options: unknown[] }).options.filter((opt): opt is string => typeof opt === 'string');
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
    const isMultiline = cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'multiline' in cognitiveQuestion.config && Boolean((cognitiveQuestion.config as { multiline?: unknown }).multiline);

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
        <h2>{cognitiveQuestion.name || getCognitiveType()}</h2>

        {/* Timer de timeout */}
        <StepTimeoutDisplay
          timeoutState={timeoutState}
          variant="minimal"
          className="ml-4"
        />
      </div>

      {/* Imagen comentada temporalmente por error de tipos */}
      {/* {cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'imageUrl' in cognitiveQuestion.config && (
        <div className="image-container" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <img
            src={(cognitiveQuestion.config as { imageUrl: string }).imageUrl}
            alt={
              'imageAlt' in cognitiveQuestion.config && typeof (cognitiveQuestion.config as { imageAlt?: unknown }).imageAlt === 'string'
                ? (cognitiveQuestion.config as { imageAlt: string }).imageAlt
                : "Estímulo visual"
            }
            style={{ maxWidth: '100%', maxHeight: '400px', border: '1px solid #eee' }}
          />
        </div>
      )} */}

      {/* Pregunta */}
      <div className="question-text" style={{
        fontSize: '1.1rem',
        marginBottom: '1.5rem',
        fontWeight: cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'highlight' in cognitiveQuestion.config && Boolean((cognitiveQuestion.config as { highlight?: unknown }).highlight) ? 'bold' : 'normal',
        backgroundColor: cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'highlight' in cognitiveQuestion.config && Boolean((cognitiveQuestion.config as { highlight?: unknown }).highlight) ? '#fffde7' : 'transparent',
        padding: cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'highlight' in cognitiveQuestion.config && Boolean((cognitiveQuestion.config as { highlight?: unknown }).highlight) ? '1rem' : '0'
      }}>
        {cognitiveQuestion.config && typeof cognitiveQuestion.config === 'object' && 'questionText' in cognitiveQuestion.config && typeof (cognitiveQuestion.config as { questionText?: unknown }).questionText === 'string'
          ? (cognitiveQuestion.config as { questionText: string }).questionText
          : "¿Cuál es tu respuesta?"}
      </div>

      {/* Respuestas */}
      {cognitiveQuestion.type.includes('multiplechoice') ? renderMultipleChoice() : renderTextInput()}

      {/* Botón de envío */}
      {!isAnswered && (
        <button
          onClick={handleSubmit}
          disabled={cognitiveQuestion.type.includes('multiplechoice') ? !selected : !answer.trim()}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: 'pointer',
            opacity: (cognitiveQuestion.type.includes('multiplechoice') ? !selected : !answer.trim()) ? 0.7 : 1
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
