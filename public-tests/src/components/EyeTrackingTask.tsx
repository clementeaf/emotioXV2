import React, { useEffect, useState } from 'react';
// import { ExpandedStep } from '../stores/participantStore';
// import { useParticipantStore } from '../stores/participantStore';

import { EyeTrackingDataPoint, EyeTrackingTaskProps } from '../types/common.types';

const EyeTrackingTask: React.FC<EyeTrackingTaskProps> = ({ question, onComplete, isAnswered = false }) => {
  const [eyeTrackingData, setEyeTrackingData] = useState<EyeTrackingDataPoint[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recordingDuration = (typeof question.config === 'object' && question.config !== null && 'duration' in question.config && typeof (question.config as { duration?: unknown }).duration === 'number')
    ? (question.config as { duration: number }).duration
    : 10; // Duración en segundos

  // Eliminar saveDataChunk y forceSaveToLocalStorage

  // Forzar guardado periódico durante la grabación (eliminado)

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
        // Eliminado: Guardar cada punto individualmente en localStorage
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording, recordingDuration]);

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
    // Eliminado: Limpiar datos parciales anteriores en localStorage
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

    // Eliminado: Guardar directamente en localStorage como respaldo y limpiar datos parciales
    onComplete(result);
  };

  // Eliminado: Cargar datos completos/parciales al montar

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
