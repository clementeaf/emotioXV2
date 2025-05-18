import React, { useState, useEffect, useCallback } from 'react';
import { ExpandedStep } from '../stores/participantStore';
import { useParticipantStore } from '../stores/participantStore';

interface EyeTrackingDataPoint {
  timestamp: number;
  x: number;
  y: number;
  fixation: boolean;
  duration: number;
}

interface EyeTrackingTaskProps {
  question: ExpandedStep;
  onComplete: (data: unknown) => void;
  isAnswered?: boolean;
}

const EyeTrackingTask: React.FC<EyeTrackingTaskProps> = ({ question, onComplete, isAnswered = false }) => {
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingDataPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recordingDuration = (typeof question.config === 'object' && question.config !== null && 'duration' in question.config && typeof (question.config as { duration?: unknown }).duration === 'number')
    ? (question.config as { duration: number }).duration
    : 10; // Duración en segundos
  
  // Acceder a la función para forzar guardado
  const forceSaveToLocalStorage = useParticipantStore(state => state.forceSaveToLocalStorage);
  
  // Guardar directamente cada fragmento de datos
  const saveDataChunk = useCallback((chunk: EyeTrackingDataPoint) => {
    try {
      // Guardar en una lista de fragmentos
      const existingChunks = localStorage.getItem(`eye_tracking_chunks_${question.id}`);
      let chunks: EyeTrackingDataPoint[] = existingChunks ? JSON.parse(existingChunks) : [];
      
      // Limitar a 100 fragmentos para evitar problemas de almacenamiento
      if (chunks.length > 100) {
        chunks = chunks.slice(-100);
      }
      
      chunks.push(chunk);
      localStorage.setItem(`eye_tracking_chunks_${question.id}`, JSON.stringify(chunks));
    } catch (error) {
      console.error('[EyeTrackingTask] Error guardando fragmento de datos:', error);
    }
  }, [question.id]);
  
  // Forzar guardado periódico durante la grabación
  useEffect(() => {
    if (!isRecording) return;
    
    const saveInterval = setInterval(() => {
      if (eyeTrackingData.length > 0) {
        // Guardar el estado actual en localStorage
        try {
          const partialResult = {
            type: question.type,
            duration: elapsed,
            dataPoints: eyeTrackingData.length,
            data: eyeTrackingData.slice(-50), // Solo guardar los últimos 50 puntos para no sobrecargar
            timestamp: Date.now(),
            partial: true
          };
          
          localStorage.setItem(`eye_tracking_partial_${question.id}`, JSON.stringify({
            stepId: question.id,
            stepType: question.type,
            answer: partialResult,
            timestamp: Date.now()
          }));
          
          console.log(`[EyeTrackingTask] Guardado parcial: ${eyeTrackingData.length} puntos`);
          
          // Forzar guardado en el store
          forceSaveToLocalStorage();
        } catch (error) {
          console.error('[EyeTrackingTask] Error en guardado parcial:', error);
        }
      }
    }, 3000); // Cada 3 segundos
    
    return () => clearInterval(saveInterval);
  }, [isRecording, eyeTrackingData, elapsed, question.id, question.type, forceSaveToLocalStorage]);
  
  // Simulación de datos de eye-tracking
  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      // Incrementar tiempo transcurrido
      setElapsed(prev => {
        const newElapsed = prev + 0.1; // Incremento de 100ms
        
        // Detener grabación si alcanzamos la duración
        if (newElapsed >= recordingDuration) {
          setIsRecording(false);
          clearInterval(interval);
        }
        
        return newElapsed;
      });
      
      // Simular datos de eye-tracking cada 100ms
      if (isRecording) {
        const newDataPoint: EyeTrackingDataPoint = {
          timestamp: Date.now(),
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          fixation: Math.random() > 0.7,
          duration: Math.random() * 100,
        };
        
        setEyeTrackingData(prev => [...prev, newDataPoint]);
        
        // Guardar cada punto individualmente
        saveDataChunk(newDataPoint);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording, recordingDuration, saveDataChunk]);
  
  // Obtener tipo específico de eye-tracking
  const getEyeTrackingType = () => {
    if (question.type.includes('heatmap')) return 'Mapa de calor';
    if (question.type.includes('gaze')) return 'Seguimiento de mirada';
    if (question.type.includes('fixation')) return 'Fijaciones';
    if (question.type.includes('saccade')) return 'Movimientos sacádicos';
    return 'Eye Tracking General';
  };
  
  // Iniciar grabación
  const startRecording = () => {
    setEyeTrackingData([]);
    setElapsed(0);
    setIsRecording(true);
    
    // Limpiar datos parciales anteriores
    try {
      localStorage.removeItem(`eye_tracking_partial_${question.id}`);
      localStorage.removeItem(`eye_tracking_chunks_${question.id}`);
    } catch (error) {
      console.error('[EyeTrackingTask] Error limpiando datos anteriores:', error);
    }
    
    console.log('[EyeTrackingTask] Iniciando grabación');
  };
  
  // Detener grabación y enviar datos
  const stopRecording = () => {
    setIsRecording(false);
    
    // Preparar y enviar datos al completar
    const result = {
      type: question.type,
      duration: elapsed,
      dataPoints: eyeTrackingData.length,
      data: eyeTrackingData,
      timestamp: Date.now(),
      questionId: question.id
    };
    
    // Guardar directamente en localStorage como respaldo
    try {
      localStorage.setItem(`eye_tracking_response_${question.id}`, JSON.stringify({
        stepId: question.id,
        stepType: question.type,
        answer: result,
        timestamp: Date.now()
      }));
      console.log(`[EyeTrackingTask] Respuesta completa guardada para ${question.id}`);
      
      // Limpiar datos parciales
      localStorage.removeItem(`eye_tracking_partial_${question.id}`);
      localStorage.removeItem(`eye_tracking_chunks_${question.id}`);
    } catch (error) {
      console.error('[EyeTrackingTask] Error en guardado final:', error);
    }
    
    onComplete(result);
    
    // Forzar guardado completo después de completar
    setTimeout(() => forceSaveToLocalStorage(), 200);
  };
  
  // Cargar datos completos al montar
  useEffect(() => {
    // Forzar guardar otros datos primero
    forceSaveToLocalStorage();
    
    // Intentar cargar datos anteriores
    if (!isAnswered) {
      try {
        const partialData = localStorage.getItem(`eye_tracking_partial_${question.id}`);
        if (partialData) {
          const parsed = JSON.parse(partialData);
          if (parsed.answer && parsed.answer.data) {
            console.log(`[EyeTrackingTask] Encontrados datos parciales para ${question.id}`);
          }
        }
      } catch (error) {
        console.error('[EyeTrackingTask] Error cargando datos parciales:', error);
      }
    }
  }, [forceSaveToLocalStorage, question.id, isAnswered]);
  
  // Cargar datos anteriores si ya se respondió
  useEffect(() => {
    if (isAnswered && question.config && typeof question.config === 'object' && 'savedResponses' in question.config) {
      // Intentar cargar desde localStorage primero (podría tener datos más completos)
      try {
        const savedDirectly = localStorage.getItem(`eye_tracking_response_${question.id}`);
        if (savedDirectly) {
          const parsed = JSON.parse(savedDirectly);
          if (parsed.answer && parsed.answer.data && Array.isArray(parsed.answer.data) && parsed.answer.data.length > 0) {
            setEyeTrackingData(parsed.answer.data as EyeTrackingDataPoint[]);
            console.log(`[EyeTrackingTask] Cargados ${parsed.answer.data.length} puntos de datos desde localStorage`);
            return;
          }
        }
      } catch (error) {
        console.error('[EyeTrackingTask] Error cargando respuesta guardada de localStorage:', error);
      }
      
      // Cargar desde store si no hay datos en localStorage
      const savedResponses = (question.config as { savedResponses?: { data?: unknown[] } }).savedResponses;
      if (savedResponses && Array.isArray(savedResponses.data)) {
        setEyeTrackingData(savedResponses.data.filter((d): d is EyeTrackingDataPoint => typeof d === 'object' && d !== null && 'x' in d && 'y' in d && 'timestamp' in d && 'fixation' in d && 'duration' in d));
        console.log(`[EyeTrackingTask] Cargados ${savedResponses.data.length} puntos de datos desde store`);
      }
    }
  }, [isAnswered, question.config, question.id]);
  
  return (
    <div className="eye-tracking-task">
      <h2>{question.name || getEyeTrackingType()}</h2>
      
      {question.config && typeof question.config === 'object' && 'description' in question.config && typeof (question.config as { description?: unknown }).description === 'string' && (
        <p className="description">{(question.config as { description: string }).description}</p>
      )}
      
      {question.config && typeof question.config === 'object' && 'imageUrl' in question.config && typeof (question.config as { imageUrl?: unknown }).imageUrl === 'string' && (
        <div className="eye-tracking-stimulus">
          <img 
            src={(question.config as { imageUrl: string }).imageUrl} 
            alt={
              question.config && typeof question.config === 'object' && 'imageAlt' in question.config && typeof (question.config as { imageAlt?: unknown }).imageAlt === 'string'
                ? (question.config as { imageAlt: string }).imageAlt
                : "Estímulo visual"
            }
            style={{ maxWidth: '100%', border: '1px solid #ccc' }} 
          />
        </div>
      )}
      
      <div className="eye-tracking-controls">
        {isRecording ? (
          <>
            <div className="recording-indicator">
              <span className="recording-dot" style={{ 
                display: 'inline-block', 
                width: '12px', 
                height: '12px', 
                backgroundColor: 'red', 
                borderRadius: '50%',
                marginRight: '8px'
              }}></span>
              Grabando: {elapsed.toFixed(1)}s / {recordingDuration}s
            </div>
            <button 
              onClick={stopRecording}
              className="stop-button"
            >
              Detener grabación
            </button>
          </>
        ) : (
          <button 
            onClick={startRecording}
            disabled={isAnswered}
            className="start-button"
          >
            {isAnswered ? 'Datos ya registrados' : 'Iniciar grabación'}
          </button>
        )}
      </div>
      
      {isAnswered && (
        <div className="data-summary">
          <h4>Resumen de datos</h4>
          <p>Puntos de datos: {eyeTrackingData.length}</p>
          {question.config && typeof question.config === 'object' && 'savedResponses' in question.config && (question.config as { savedResponses?: { duration?: unknown } }).savedResponses &&
            typeof (question.config as { savedResponses: { duration?: unknown } }).savedResponses.duration === 'number' && (
              <p>Duración: {(question.config as { savedResponses: { duration: number } }).savedResponses.duration.toFixed(2)}s</p>
          )}
        </div>
      )}
      
      {/* Visualización simple de los datos para depuración */}
      {eyeTrackingData.length > 0 && (
        <div className="data-visualization" style={{ position: 'relative', height: '200px', border: '1px solid #ccc', marginTop: '20px' }}>
          {eyeTrackingData.slice(-100).map((point, idx) => (
            <div 
              key={idx}
              style={{
                position: 'absolute',
                left: `${(point.x / window.innerWidth) * 100}%`,
                top: `${(point.y / window.innerHeight) * 100}%`,
                width: point.fixation ? '8px' : '4px',
                height: point.fixation ? '8px' : '4px',
                backgroundColor: point.fixation ? 'red' : 'blue',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
          {eyeTrackingData.length > 100 && (
            <div style={{ position: 'absolute', bottom: '5px', right: '5px', fontSize: '12px', color: '#666' }}>
              Mostrando los últimos 100 de {eyeTrackingData.length} puntos
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EyeTrackingTask; 