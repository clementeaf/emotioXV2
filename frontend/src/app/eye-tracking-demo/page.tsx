'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WebGazerEyeTrackingSDK } from '../../sdk/webgazer-eye-tracking';
import type { 
  GazePoint, 
  EyeTrackerConfig, 
  EyeTrackerStatus,
  StartEyeTrackingParams 
} from '../../../../shared/eye-tracking-types';

/**
 * Página de Demo para Eye Tracking REAL
 * Prueba con 3 puntos numerados y detección en tiempo real
 */
export default function EyeTrackingDemo() {
  // Estados del SDK
  const [sdk] = useState(() => new WebGazerEyeTrackingSDK('http://localhost:3001/dev'));
  const [status, setStatus] = useState<EyeTrackerStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Estados para la prueba real
  const [testActive, setTestActive] = useState(false);
  const [testPoints, setTestPoints] = useState<Array<{id: number, x: number, y: number, hit: boolean}>>([]);
  const [lastHit, setLastHit] = useState<number | null>(null);
  const [calibrationActive, setCalibrationActive] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<{x: number, y: number} | null>(null);
  const [calibrationPoints, setCalibrationPoints] = useState<Array<{x: number, y: number, id: number}>>([]);
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState(0);
  
  // Referencias
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Efecto para escuchar eventos del SDK
  useEffect(() => {
    const handleGazeData = (data: GazePoint) => {
      // Actualizar posición actual de la mirada
      setCurrentGaze({ x: data.x, y: data.y });
      
      if (testActive) {
        checkGazeHit(data);
      }
    };
    const handleStatusChange = (newStatus: EyeTrackerStatus) => {
      setStatus(newStatus);
    };
    const handleSessionStarted = (data: any) => {
      setSessionId(data.sessionId);
      setIsTracking(true);
      setStatus('tracking');
      console.log('[EyeTrackingDemo] Sesión iniciada:', data);
    };
    const handleSessionStopped = (data: any) => {
      setIsTracking(false);
      setStatus('disconnected');
      console.log('[EyeTrackingDemo] Sesión detenida:', data);
    };
    const handleCameraPermissionGranted = (data: any) => {
      console.log('[EyeTrackingDemo] Permisos de cámara concedidos:', data);
    };
    const handleCameraPermissionDenied = (data: any) => {
      console.log('[EyeTrackingDemo] Permisos de cámara denegados:', data);
    };

    sdk.on('gazeData', handleGazeData);
    sdk.on('statusChange', handleStatusChange);
    sdk.on('sessionStarted', handleSessionStarted);
    sdk.on('sessionStopped', handleSessionStopped);
    sdk.on('cameraPermissionGranted', handleCameraPermissionGranted);
    sdk.on('cameraPermissionDenied', handleCameraPermissionDenied);

    return () => {
      sdk.off('gazeData', handleGazeData);
      sdk.off('statusChange', handleStatusChange);
      sdk.off('sessionStarted', handleSessionStarted);
      sdk.off('sessionStopped', handleSessionStopped);
      sdk.off('cameraPermissionGranted', handleCameraPermissionGranted);
      sdk.off('cameraPermissionDenied', handleCameraPermissionDenied);
    };
  }, [sdk, testActive]);

  // Iniciar eye tracking
  const startTracking = async () => {
    try {
      console.log('[EyeTrackingDemo] Iniciando eye tracking real...');
      const params = {
        participantId: `real-user-${Date.now()}`,
        config: {
          platform: 'web' as const,
          sampleRate: 60,
          enableCalibration: true,
          calibrationPoints: 9,
          trackingMode: 'screen' as const,
          smoothing: true,
          smoothingFactor: 0.7,
          sdkVersion: '1.0.0',
          enableRemoteTesting: true,
          enableHeatmaps: true,
          enableRealTimeInsights: true
        },
        areasOfInterest: []
      };

      const result = await sdk.startTracking(params);

      if (result.success && result.data?.sessionId) {
        setSessionId(result.data.sessionId);
        setIsTracking(true);
        setStatus('tracking');
        console.log(`[EyeTrackingDemo] Sesión iniciada: ${result.data.sessionId}`);
      } else {
        throw new Error(result.error || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      console.error('[EyeTrackingDemo] Error:', err);
      alert(`Error al iniciar eye tracking: ${err.message}`);
    }
  };

  // Detener eye tracking
  const stopTracking = async () => {
    if (!sessionId) return;

    try {
      console.log('[EyeTrackingDemo] Deteniendo eye tracking...');
      const result = await sdk.stopTracking({
        sessionId,
        saveData: true,
        generateAnalysis: false
      });

      if (result.success) {
        setIsTracking(false);
        setStatus('disconnected');
        setTestActive(false);
        setTestPoints([]);
        console.log('[EyeTrackingDemo] Sesión detenida');
      } else {
        throw new Error(result.error || 'Error al detener sesión');
      }
    } catch (err: any) {
      console.error('[EyeTrackingDemo] Error:', err);
      alert(`Error al detener eye tracking: ${err.message}`);
    }
  };

  // Iniciar prueba de puntos
  const startPointTest = () => {
    if (!isTracking) {
      alert('Debes iniciar eye tracking primero');
      return;
    }

    // Generar 3 puntos fijos en posiciones específicas - MEJOR DISTRIBUCIÓN
    const points = [
      { id: 1, x: window.innerWidth * 0.2, y: window.innerHeight * 0.3, hit: false }, // Superior izquierda
      { id: 2, x: window.innerWidth * 0.8, y: window.innerHeight * 0.3, hit: false }, // Superior derecha
      { id: 3, x: window.innerWidth * 0.5, y: window.innerHeight * 0.7, hit: false }  // Centro inferior
    ];

    setTestPoints(points);
    setTestActive(true);
    setLastHit(null);
    
    alert('🎯 Prueba iniciada! Mira a los puntos numerados 1, 2 y 3. El sistema detectará cuando los mires.');
  };

  // Detener prueba
  const stopPointTest = () => {
    setTestActive(false);
    setTestPoints([]);
    setLastHit(null);
  };

  // Iniciar calibración automática de WebGazer
  const startCalibration = async () => {
    if (!isTracking) {
      alert('Debes iniciar eye tracking primero');
      return;
    }

    try {
      console.log('[EyeTrackingDemo] Iniciando calibración automática de WebGazer...');
      
      // Usar calibración automática de WebGazer
      const calibrationResult = await sdk.startCalibration();
      
      if (calibrationResult.success) {
        alert('🎯 ¡Calibración completada!\n\nEl sistema WebGazer ha sido calibrado automáticamente.\n\nAhora el punto verde debería seguir tu mirada correctamente.\n\nPrueba moviendo los ojos por la pantalla para verificar.');
      } else {
        alert(`Error en la calibración: ${calibrationResult.error}`);
      }
      
    } catch (err: any) {
      console.error('[EyeTrackingDemo] Error en calibración:', err);
      alert(`Error en la calibración: ${err.message}`);
    }
  };

  // Secuencia de calibración punto por punto - MÁS FÁCIL
  const startCalibrationSequence = () => {
    if (currentCalibrationPoint < calibrationPoints.length) {
      const point = calibrationPoints[currentCalibrationPoint];
      
      // Mostrar instrucciones MÁS SIMPLES
      alert(`🎯 Calibración - Punto ${currentCalibrationPoint + 1}/${calibrationPoints.length}\n\nMira DIRECTAMENTE al punto ${point.id} que aparece en pantalla.\n\n⏱️ Mantén la mirada fija por 3 segundos.\n\n✅ Haz clic en "Aceptar" cuando estés listo.`);
      
      // Avanzar al siguiente punto después de 3 segundos (más rápido)
      setTimeout(() => {
        setCurrentCalibrationPoint(prev => prev + 1);
      }, 3000);
    } else {
      // Calibración completada
      setCalibrationActive(false);
      setCalibrationPoints([]);
      setCurrentCalibrationPoint(0);
      alert('🎯 ¡Calibración completada!\n\n\nAhora el punto verde debería seguir tu mirada.\n\nPrueba moviendo los ojos por la pantalla.\n\nSi funciona bien, inicia la prueba de puntos.');
    }
  };

  // Verificar si la mirada golpea un punto
  const checkGazeHit = (gazePoint: GazePoint) => {
    if (!testActive) return;

    // Validar que las coordenadas sean válidas
    if (gazePoint.x < 0 || gazePoint.x > window.innerWidth || 
        gazePoint.y < 0 || gazePoint.y > window.innerHeight) {
      return; // Coordenadas fuera de pantalla
    }

    const hitRadius = 80; // Radio optimizado para WebGazer
    const minValidity = 0.6; // Validez ajustada para WebGazer
    
    // Verificar validez de los datos de mirada
    const leftEyeValid = gazePoint.leftEye?.validity || 0;
    const rightEyeValid = gazePoint.rightEye?.validity || 0;
    const avgValidity = (leftEyeValid + rightEyeValid) / 2;
    
    if (avgValidity < minValidity) {
      return; // Datos no suficientemente válidos
    }
    
    testPoints.forEach(point => {
      if (point.hit) return; // Ya fue detectado
      
      const distance = Math.sqrt(
        Math.pow(gazePoint.x - point.x, 2) + 
        Math.pow(gazePoint.y - point.y, 2)
      );
      
      if (distance <= hitRadius) {
        // Punto alcanzado
        setTestPoints(prev => prev.map(p => 
          p.id === point.id ? { ...p, hit: true } : p
        ));
        
        setLastHit(point.id);
        
        // Alert con el punto detectado
        alert(`🎯 ¡PUNTO ${point.id} DETECTADO! 🎯\n\nEl sistema identificó que estás mirando el punto ${point.id}\nCoordenadas: (${Math.round(gazePoint.x)}, ${Math.round(gazePoint.y)})\nValidez: ${(avgValidity * 100).toFixed(1)}%`);
        
        console.log(`[EyeTrackingDemo] Punto ${point.id} detectado en coordenadas (${gazePoint.x}, ${gazePoint.y}) con validez ${avgValidity}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Indicador global de mirada - aparece en toda la pantalla */}
      {currentGaze && (
        <div
          className="fixed w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-2xl transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 animate-pulse"
          style={{
            left: `${currentGaze.x}px`,
            top: `${currentGaze.y}px`,
          }}
        />
      )}
      
      {/* Header fijo */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-center text-gray-800 flex items-center justify-center">
          <span className="mr-4">🎯 Prueba Real de Eye Tracking</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Estado del Sistema */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Estado del Sistema</h2>
          <p className="text-lg flex items-center">
            Estado: <span className={`ml-2 px-3 py-1 rounded-full text-white ${status === 'tracking' ? 'bg-green-500' : 'bg-red-500'}`}>{status}</span>
          </p>
          <p className="text-lg">Sesión: {sessionId ? 'Activa' : 'Inactiva'}</p>
          <p className="text-lg">Prueba: {testActive ? 'Activa' : 'Inactiva'}</p>
        </div>

        {/* Controles */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Controles</h2>
          <div className="flex flex-col space-y-4">
            <button
              onClick={startTracking}
              disabled={isTracking}
              className={`py-3 px-6 rounded-lg text-white font-semibold transition duration-300 ${isTracking ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isTracking ? 'Eye Tracking Activo' : 'Iniciar Eye Tracking'}
            </button>
            <button
              onClick={stopTracking}
              disabled={!isTracking}
              className={`py-3 px-6 rounded-lg text-white font-semibold transition duration-300 ${!isTracking ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Detener Eye Tracking
            </button>
            <button
              onClick={startPointTest}
              disabled={!isTracking || testActive}
              className={`py-3 px-6 rounded-lg text-white font-semibold transition duration-300 ${!isTracking || testActive ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              Iniciar Prueba de Puntos
            </button>
            <button
              onClick={stopPointTest}
              disabled={!testActive}
              className={`py-3 px-6 rounded-lg text-white font-semibold transition duration-300 ${!testActive ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              Detener Prueba
            </button>
            
            <button
              onClick={startCalibration}
              disabled={!isTracking || calibrationActive}
              className={`py-3 px-6 rounded-lg text-white font-semibold transition duration-300 ${!isTracking || calibrationActive ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700'}`}
            >
              {calibrationActive ? 'Calibrando...' : 'Calibrar Sistema'}
            </button>
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Instrucciones</h2>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Inicia Eye Tracking</strong> - Se solicitarán permisos de cámara</p>
            <p>2. <strong>Calibra WebGazer</strong> - Calibración automática de 9 puntos</p>
            <p>3. <strong>Inicia Prueba</strong> - Aparecerán 3 puntos numerados</p>
            <p>4. <strong>Mira a los puntos</strong> - El sistema detectará tu mirada real</p>
            <p>5. <strong>Recibe alerts</strong> - Cada vez que mires un punto</p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 font-semibold mb-2">
              🎯 Calibración Automática WebGazer:
            </p>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Calibración automática de 9 puntos</li>
              <li>• Mantén la cabeza quieta durante la calibración</li>
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Sigue las instrucciones en pantalla</li>
              <li>• Basado en documentación oficial de WebGazer</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Área de Calibración - Pantalla Completa */}
      {calibrationActive && (
        <div className="fixed inset-0 bg-gray-50 z-30">
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg z-40">
            <h2 className="text-lg font-semibold mb-2">🎯 Calibración Activa</h2>
            <p className="text-sm">Punto actual: {currentCalibrationPoint + 1}/{calibrationPoints.length}</p>
            {currentGaze && (
              <p className="text-sm">Mirada: ({Math.round(currentGaze.x)}, {Math.round(currentGaze.y)})</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setCalibrationActive(false)}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setCurrentCalibrationPoint(0);
                  startCalibrationSequence();
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Reiniciar
              </button>
            </div>
          </div>
          
          <div className="relative w-full h-full">
            {/* Puntos de calibración */}
            {calibrationPoints.map((point, index) => (
              <div
                key={point.id}
                className={`absolute w-12 h-12 rounded-full border-4 flex items-center justify-center text-xl font-bold text-white transform -translate-x-1/2 -translate-y-1/2 ${
                  index === currentCalibrationPoint 
                    ? 'bg-green-500 border-green-700 animate-pulse shadow-2xl' 
                    : index < currentCalibrationPoint
                    ? 'bg-gray-400 border-gray-600'
                    : 'bg-blue-500 border-blue-700'
                }`}
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                }}
              >
                {point.id}
              </div>
            ))}
            
            {/* Instrucciones visuales durante la calibración */}
            {currentCalibrationPoint < calibrationPoints.length && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white px-6 py-4 rounded-lg text-center z-50">
                <h3 className="text-xl font-bold mb-2">🎯 Mira al punto {calibrationPoints[currentCalibrationPoint]?.id}</h3>
                <p className="text-lg">Mantén la mirada fija por 3 segundos</p>
                <div className="mt-4 w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-3000"
                    style={{ width: `${((currentCalibrationPoint + 1) / calibrationPoints.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {/* Información de calibración */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
              <p className="text-sm">Punto actual: {currentCalibrationPoint + 1}/{calibrationPoints.length}</p>
              {currentGaze && (
                <p className="text-sm">Mirada: ({Math.round(currentGaze.x)}, {Math.round(currentGaze.y)})</p>
              )}
            </div>
            
            {/* Indicador de mirada actual */}
            {currentGaze && (
              <div
                className="fixed w-6 h-6 bg-red-500 rounded-full border-3 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                style={{
                  left: `${currentGaze.x}px`,
                  top: `${currentGaze.y}px`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Área de Prueba - Pantalla Completa */}
      {testActive && (
        <div className="fixed inset-0 bg-gray-50 z-30">
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-3 rounded-lg z-40">
            <h2 className="text-lg font-semibold mb-2">🎯 Prueba Activa</h2>
            <p className="text-sm">Puntos detectados: {testPoints.filter(p => p.hit).length}/3</p>
            {lastHit && <p className="text-sm">Último punto: {lastHit}</p>}
            {currentGaze && (
              <p className="text-sm">Mirada: ({Math.round(currentGaze.x)}, {Math.round(currentGaze.y)})</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={stopPointTest}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Detener Prueba
              </button>
              <button
                onClick={() => setTestActive(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Salir
              </button>
            </div>
          </div>
          
          <div className="relative w-full h-full">
            {/* Puntos numerados */}
            {testPoints.map((point) => (
              <div
                key={point.id}
                className={`absolute w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl font-bold text-white transform -translate-x-1/2 -translate-y-1/2 ${
                  point.hit 
                    ? 'bg-green-500 border-green-700' 
                    : 'bg-red-500 border-red-700'
                }`}
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                }}
              >
                {point.id}
              </div>
            ))}
            
            {/* Información de la prueba */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
              <p className="text-sm">Puntos detectados: {testPoints.filter(p => p.hit).length}/3</p>
              {lastHit && <p className="text-sm">Último punto: {lastHit}</p>}
              {currentGaze && (
                <p className="text-sm">Mirada: ({Math.round(currentGaze.x)}, {Math.round(currentGaze.y)})</p>
              )}
            </div>
            
            {/* Indicador de mirada actual */}
            {currentGaze && (
              <div
                className="fixed w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
                style={{
                  left: `${currentGaze.x}px`,
                  top: `${currentGaze.y}px`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Resultados */}
      {testActive && testPoints.some(p => p.hit) && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-green-800 mb-4">🎉 Resultados de la Prueba</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testPoints.filter(p => p.hit).length}</div>
              <div className="text-sm text-green-700">Puntos Detectados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3</div>
              <div className="text-sm text-green-700">Total de Puntos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{((testPoints.filter(p => p.hit).length / 3) * 100).toFixed(1)}%</div>
              <div className="text-sm text-green-700">Precisión</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}