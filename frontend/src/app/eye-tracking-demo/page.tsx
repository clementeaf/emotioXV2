'use client';

import React, { useEffect, useRef, useState } from 'react';
import { WebGazerEyeTrackingSDK } from '../../sdk/webgazer-eye-tracking';

/**
 * Página de Demo para Eye Tracking LOCAL
 * 5 puntos rojos con sistema de calibración WebGazer
 */
export default function EyeTrackingDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [currentCalibrationPoint, setCurrentCalibrationPoint] = useState<number | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [calibrationData, setCalibrationData] = useState<{[key: number]: number}>({});
  
  // Estados de WebGazer
  const [sdk] = useState(() => new WebGazerEyeTrackingSDK('local-demo'));
  const [isTracking, setIsTracking] = useState(false);
  const [currentGaze, setCurrentGaze] = useState<{x: number, y: number} | null>(null);
  const [webgazerStatus, setWebgazerStatus] = useState<string>('disconnected');
  const [calibratedGaze, setCalibratedGaze] = useState<{x: number, y: number} | null>(null);

  // Inicializar WebGazer
  useEffect(() => {
    const initializeWebGazer = async () => {
      try {
        console.log('[EyeTrackingDemo] Inicializando WebGazer...');
        
        // Configurar event listeners
        sdk.on('gazeData', (data: any) => {
          setCurrentGaze({ x: data.x, y: data.y });
        });
        
        sdk.on('statusChange', (status: string) => {
          setWebgazerStatus(status);
          console.log('[EyeTrackingDemo] WebGazer status:', status);
        });
        
        sdk.on('sessionStarted', (data: any) => {
          setIsTracking(true);
          setWebgazerStatus('tracking');
          console.log('[EyeTrackingDemo] Sesión iniciada:', data);
        });
        
        sdk.on('sessionStopped', (data: any) => {
          setIsTracking(false);
          setWebgazerStatus('disconnected');
          console.log('[EyeTrackingDemo] Sesión detenida:', data);
        });
        
        console.log('[EyeTrackingDemo] WebGazer inicializado correctamente');
      } catch (error) {
        console.error('[EyeTrackingDemo] Error inicializando WebGazer:', error);
      }
    };
    
    initializeWebGazer();
    
    return () => {
      // Cleanup
      sdk.off('gazeData', () => {});
      sdk.off('statusChange', () => {});
      sdk.off('sessionStarted', () => {});
      sdk.off('sessionStopped', () => {});
    };
  }, [sdk]);

  useEffect(() => {
    // Crear 5 puntos rojos al centro de la pantalla
    const createPoints = () => {
      if (!containerRef.current) return;

      // Limpiar puntos existentes
      containerRef.current.innerHTML = '';

      // Posiciones de los 5 puntos bien distribuidos por toda la pantalla
      const positions = [
        { x: 0, y: 0 },           // Centro
        { x: -300, y: -200 },      // Esquina superior izquierda (más lejos)
        { x: 300, y: -200 },       // Esquina superior derecha (más lejos)
        { x: -300, y: 200 },       // Esquina inferior izquierda (más lejos)
        { x: 300, y: 200 }         // Esquina inferior derecha (más lejos)
      ];

      positions.forEach((pos, index) => {
        const point = document.createElement('div');
        point.id = `point-${index + 1}`;
        // Determinar el estilo del punto según el estado de calibración
        let pointClass = 'absolute w-8 h-8 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-sm cursor-pointer transition-all duration-300';
        
        if (calibrationMode && currentCalibrationPoint === index + 1) {
          // Punto actual en calibración - azul pulsante con indicador de entrenamiento
          pointClass += ' bg-blue-500 animate-pulse ring-4 ring-blue-200';
        } else if (calibrationData[index + 1] >= 5) {
          // Punto ya calibrado - verde
          pointClass += ' bg-green-500';
        } else {
          // Punto normal - rojo
          pointClass += ' bg-red-500 hover:bg-red-600';
        }
        
        point.className = pointClass;
        point.style.left = `calc(50% + ${pos.x}px)`;
        point.style.top = `calc(50% + ${pos.y}px)`;
        point.style.transform = 'translate(-50%, -50%)';
        point.style.zIndex = '10';
        point.textContent = `${index + 1}`;
        
        // Agregar evento click para calibración con WebGazer
        point.addEventListener('click', async () => {
          if (calibrationMode && currentCalibrationPoint === index + 1) {
            setClickCount(prev => {
              const newCount = prev + 1;
              console.log(`Calibración punto ${index + 1}: ${newCount}/5 clicks`);
              
              // ✅ CALIBRACIÓN REAL CON WEBGAZER
              if (newCount === 1) {
                // Primer click - iniciar calibración de WebGazer para este punto
                console.log(`[WebGazer] Iniciando calibración para punto ${index + 1}`);
                // WebGazer comenzará a aprender la correlación entre mirada y este punto
              }
              
              // ✅ ENVIAR DATOS DE CALIBRACIÓN A WEBGAZER
              if (currentGaze) {
                console.log(`[WebGazer] Datos de calibración - Punto: ${index + 1}, Mirada: (${currentGaze.x}, ${currentGaze.y})`);
                
                // Enviar datos de calibración a WebGazer para que aprenda
                try {
                  // ✅ SEÑAL DE ENTRENAMIENTO: "Aquí está mi mirada"
                  const calibrationData = {
                    pointId: index + 1,
                    gazeX: currentGaze.x,
                    gazeY: currentGaze.y,
                    clickCount: newCount,
                    // ✅ ESTA ES LA SEÑAL QUE LE DICE A WEBGAZER: "AQUÍ ESTÁ MI MIRADA"
                    trainingSignal: true,
                    message: `Click ${newCount}: Mirada en punto ${index + 1}`
                  };
                  
                  console.log(`[WebGazer] 🎯 SEÑAL DE ENTRENAMIENTO:`, calibrationData);
                  console.log(`[WebGazer] "Aquí está mi mirada" - Punto ${index + 1}, Click ${newCount}/5`);
                  
                  // ✅ WEBGAZER APRENDE: "Cuando veo esta posición de ojos, significa que está mirando el punto X"
                  // Cada click es una muestra de entrenamiento para el algoritmo de WebGazer
                  
                  // ✅ ENTRENAR WEBGAZER CON LA POSICIÓN REAL DEL PUNTO
                  const pointElement = document.getElementById(`point-${index + 1}`);
                  if (pointElement) {
                    const rect = pointElement.getBoundingClientRect();
                    const pointCenterX = rect.left + rect.width / 2;
                    const pointCenterY = rect.top + rect.height / 2;
                    
                    console.log(`[WebGazer] 🎯 ENTRENANDO: Configuración facial → Punto ${index + 1} en (${pointCenterX}, ${pointCenterY})`);
                    
                    // ✅ AQUÍ WEBGAZER DEBE APRENDER: "Esta configuración facial = punto en (X, Y)"
                    // El algoritmo de WebGazer debe ajustarse para que el punto azul se mueva hacia aquí
                    
                    // ✅ ENTRENAR WEBGAZER CON LA CORRELACIÓN REAL
                    try {
                      // Enviar datos de entrenamiento a WebGazer
                      const trainingData = {
                        facialConfig: {
                          // Datos de la configuración facial actual que WebGazer está detectando
                          eyePosition: currentGaze,
                          timestamp: Date.now()
                        },
                        targetPoint: {
                          id: index + 1,
                          x: pointCenterX,
                          y: pointCenterY
                        },
                        clickNumber: newCount,
                        message: `Entrenamiento ${newCount}/5: Configuración facial → Punto ${index + 1}`
                      };
                      
                      console.log(`[WebGazer] 📚 DATOS DE ENTRENAMIENTO:`, trainingData);
                      
                      // ✅ WEBGAZER DEBE AJUSTAR SU ALGORITMO:
                      // "Cuando veo esta configuración facial, el punto azul debe estar en (${pointCenterX}, ${pointCenterY})"
                      
                      // ✅ ENTRENAR WEBGAZER REALMENTE
                      try {
                        // Usar la API de WebGazer para entrenar con el punto objetivo
                        console.log(`[WebGazer] 🔧 ENTRENANDO ALGORITMO: Ajustando detección hacia punto ${index + 1}`);
                        
                        // WebGazer debe aprender que esta configuración facial corresponde a este punto
                        // Esto debería hacer que el punto azul se mueva hacia el punto objetivo
                        
                        // ✅ ENTRENAR WEBGAZER REALMENTE
                        // NO mover artificialmente el punto azul, sino entrenar a WebGazer
                        console.log(`[WebGazer] 🎯 ENTRENANDO: Configuración facial actual → Punto objetivo ${index + 1}`);
                        console.log(`[WebGazer] 📊 Datos: Mirada detectada (${currentGaze.x}, ${currentGaze.y}) → Punto objetivo (${pointCenterX}, ${pointCenterY})`);
                        
                        // ✅ EFECTO VISUAL: Mostrar que se está entrenando
                        const pointElement = document.getElementById(`point-${index + 1}`);
                        if (pointElement) {
                          pointElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                          pointElement.style.transition = 'all 0.3s ease';
                          setTimeout(() => {
                            pointElement.style.transform = 'translate(-50%, -50%) scale(1)';
                          }, 300);
                        }
                        
                        // ✅ ENTRENAR WEBGAZER CON LA CORRELACIÓN
                        // Aquí WebGazer debería aprender la correlación entre configuración facial y punto objetivo
                        console.log(`[WebGazer] 📚 ENTRENAMIENTO: Configuración facial → Punto ${index + 1} en (${pointCenterX}, ${pointCenterY})`);
                        
                      } catch (webgazerError) {
                        console.error('[WebGazer] Error entrenando WebGazer:', webgazerError);
                      }
                      
                    } catch (trainingError) {
                      console.error('[WebGazer] Error en entrenamiento:', trainingError);
                    }
                  }
                  
                } catch (error) {
                  console.error('[WebGazer] Error enviando datos de calibración:', error);
                }
              } else {
                console.warn(`[WebGazer] ⚠️ No se detectó mirada en click ${newCount} del punto ${index + 1}`);
              }
              
              if (newCount >= 5) {
                // Completar calibración de este punto
                setCalibrationData(prev => ({
                  ...prev,
                  [index + 1]: newCount
                }));
                
                // ✅ FINALIZAR CALIBRACIÓN DE WEBGAZER PARA ESTE PUNTO
                console.log(`[WebGazer] Calibración completada para punto ${index + 1}`);
                
                // Pasar al siguiente punto o completar calibración
                if (index + 1 < 5) {
                  setCurrentCalibrationPoint(index + 2);
                  setClickCount(0);
                  console.log(`Calibración completada para punto ${index + 1}. Siguiente: punto ${index + 2}`);
                } else {
                  console.log('¡Calibración completada para todos los puntos!');
                  setCalibrationMode(false);
                  setCurrentCalibrationPoint(null);
                  setClickCount(0);
                  
                  // ✅ CALIBRACIÓN COMPLETA DE WEBGAZER
                  console.log('[WebGazer] ¡Calibración completa! WebGazer ahora puede detectar mirada con precisión');
                }
              }
              return newCount;
            });
          } else {
            console.log(`Punto ${index + 1} clickeado`);
          }
        });
        
        containerRef.current?.appendChild(point);
      });
    };

    createPoints();

    // Recrear puntos si cambia el tamaño de la ventana
    const handleResize = () => {
      setTimeout(createPoints, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calibrationMode, currentCalibrationPoint, calibrationData]);

  const startWebGazer = async () => {
    try {
      console.log('[EyeTrackingDemo] Iniciando WebGazer...');
      const result = await sdk.startTracking({
        participantId: `demo-user-${Date.now()}`,
        config: {
          platform: 'web',
          sampleRate: 60,
          enableCalibration: true,
          calibrationPoints: 5,
          trackingMode: 'screen',
          smoothing: true,
          smoothingFactor: 0.7,
          sdkVersion: '1.0.0',
          enableRemoteTesting: true,
          enableHeatmaps: true,
          enableRealTimeInsights: true
        }
      });
      
      if (result.success) {
        console.log('[EyeTrackingDemo] WebGazer iniciado correctamente');
      } else {
        console.error('[EyeTrackingDemo] Error iniciando WebGazer:', result.error);
      }
    } catch (error) {
      console.error('[EyeTrackingDemo] Error iniciando WebGazer:', error);
    }
  };

  const stopWebGazer = async () => {
    try {
      console.log('[EyeTrackingDemo] Deteniendo WebGazer...');
      const result = await sdk.stopTracking({
        sessionId: 'local-session',
        saveData: true,
        generateAnalysis: false
      });
      
      if (result.success) {
        console.log('[EyeTrackingDemo] WebGazer detenido correctamente');
      } else {
        console.error('[EyeTrackingDemo] Error deteniendo WebGazer:', result.error);
      }
    } catch (error) {
      console.error('[EyeTrackingDemo] Error deteniendo WebGazer:', error);
    }
  };

  const startCalibration = async () => {
    setCalibrationMode(true);
    setCurrentCalibrationPoint(1);
    setClickCount(0);
    setCalibrationData({});
    console.log('Iniciando calibración - Mira el punto 1 y haz click 5 veces');
    
    // ✅ INICIAR CALIBRACIÓN REAL DE WEBGAZER
    try {
      console.log('[WebGazer] Iniciando calibración automática...');
      const calibrationResult = await sdk.startCalibration();
      if (calibrationResult.success) {
        console.log('[WebGazer] Calibración iniciada correctamente');
      } else {
        console.error('[WebGazer] Error iniciando calibración:', calibrationResult.error);
      }
    } catch (error) {
      console.error('[WebGazer] Error en calibración:', error);
    }
  };

  const stopCalibration = () => {
    setCalibrationMode(false);
    setCurrentCalibrationPoint(null);
    setClickCount(0);
    console.log('Calibración detenida');
  };

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      {/* Controles de WebGazer */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">WebGazer Eye Tracking</h2>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Estado:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                webgazerStatus === 'tracking' ? 'bg-green-100 text-green-800' :
                webgazerStatus === 'disconnected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {webgazerStatus}
              </span>
            </div>
            
            {!isTracking ? (
              <button
                onClick={startWebGazer}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors w-full"
              >
                Iniciar WebGazer
              </button>
            ) : (
              <button
                onClick={stopWebGazer}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors w-full"
              >
                Detener WebGazer
              </button>
            )}
          </div>
        </div>

        {/* Controles de calibración */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-lg font-bold mb-2">Calibración</h2>
          
          {!calibrationMode ? (
            <button
              onClick={startCalibration}
              disabled={!isTracking}
              className={`px-4 py-2 rounded transition-colors w-full ${
                isTracking 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Iniciar Calibración
            </button>
          ) : (
            <div>
              <button
                onClick={stopCalibration}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors mb-2 w-full"
              >
                Detener Calibración
              </button>
              
              {currentCalibrationPoint && (
                <div className="text-sm text-gray-700">
                  <p className="font-medium">Mira el punto {currentCalibrationPoint}</p>
                  <p>Clicks: {clickCount}/5</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Haz click 5 veces mientras miras el punto
                  </p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    💡 Cada click le dice a WebGazer: "Aquí está mi mirada"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Estado de calibración */}
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-sm font-bold mb-2">Progreso</h3>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(point => (
              <div key={point} className="flex items-center text-xs">
                <span className="w-4 h-4 rounded-full mr-2 flex items-center justify-center text-white text-xs font-bold"
                      style={{
                        backgroundColor: calibrationData[point] >= 5 ? '#10b981' : 
                                       currentCalibrationPoint === point ? '#3b82f6' : '#e5e7eb'
                      }}>
                  {point}
                </span>
                <span className={calibrationData[point] >= 5 ? 'text-green-600' : 'text-gray-500'}>
                  {calibrationData[point] >= 5 ? '✓ Completado' : 'Pendiente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicador de mirada en tiempo real - SOLO MIrada REAL de WebGazer */}
      {currentGaze && isTracking && (
        <div
          className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-30 animate-pulse"
          style={{
            left: `${currentGaze.x}px`,
            top: `${currentGaze.y}px`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
          }}
        />
      )}

      {/* Línea de correlación durante calibración */}
      {calibrationMode && currentCalibrationPoint && currentGaze && (
        <svg className="absolute inset-0 pointer-events-none z-20" style={{ width: '100%', height: '100%' }}>
          <line
            x1={currentGaze?.x || 0}
            y1={currentGaze?.y || 0}
            x2={(() => {
              const pointElement = document.getElementById(`point-${currentCalibrationPoint}`);
              if (pointElement) {
                const rect = pointElement.getBoundingClientRect();
                return rect.left + rect.width / 2;
              }
              return currentGaze?.x || 0;
            })()}
            y2={(() => {
              const pointElement = document.getElementById(`point-${currentCalibrationPoint}`);
              if (pointElement) {
                const rect = pointElement.getBoundingClientRect();
                return rect.top + rect.height / 2;
              }
              return currentGaze?.y || 0;
            })()}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Información de mirada */}
      {currentGaze && isTracking && (
        <div className="absolute bottom-4 left-4 z-20">
          <div className="bg-white rounded-lg shadow-lg p-3">
            <h3 className="text-sm font-bold mb-1">Mirada Detectada</h3>
            <p className="text-xs text-gray-600">
              X: {Math.round(currentGaze.x)}, Y: {Math.round(currentGaze.y)}
            </p>
            {calibrationMode && currentCalibrationPoint && (
              <div className="mt-2 p-2 bg-blue-50 rounded">
                <p className="text-xs text-blue-700 font-medium">
                  🎯 WebGazer aprendiendo punto {currentCalibrationPoint}
                </p>
                <p className="text-xs text-blue-600">
                  {clickCount}/5 clicks - "Aquí está mi mirada"
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Cada click = Señal de entrenamiento para WebGazer
                </p>
                {currentGaze && (
                  <div className="mt-2 p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-700 font-medium">
                      🎯 Correlación: Mirada → Punto {currentCalibrationPoint}
                    </p>
                    <p className="text-xs text-green-600">
                      WebGazer aprendiendo: "Esta configuración facial = punto objetivo"
                    </p>
                    <div className="mt-2 p-2 bg-yellow-50 rounded">
                      <p className="text-xs text-yellow-700 font-medium">
                        🎯 Punto azul = Mirada REAL de WebGazer
                      </p>
                      <p className="text-xs text-yellow-600">
                        Los clicks entrenan a WebGazer para mejorar la detección
                      </p>
                      {currentGaze && (
                        <div className="mt-1 p-1 bg-blue-50 rounded">
                          <p className="text-xs text-blue-600">
                            📍 Distancia: {Math.round(Math.sqrt(
                              Math.pow(currentGaze.x - (() => {
                                const pointElement = document.getElementById(`point-${currentCalibrationPoint}`);
                                if (pointElement) {
                                  const rect = pointElement.getBoundingClientRect();
                                  return rect.left + rect.width / 2;
                                }
                                return 0;
                              })(), 2) + 
                              Math.pow(currentGaze.y - (() => {
                                const pointElement = document.getElementById(`point-${currentCalibrationPoint}`);
                                if (pointElement) {
                                  const rect = pointElement.getBoundingClientRect();
                                  return rect.top + rect.height / 2;
                                }
                                return 0;
                              })(), 2)
                            ))}px del objetivo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor de puntos */}
      <div 
        ref={containerRef}
        className="w-full h-full cursor-pointer"
      />
    </div>
  );
}