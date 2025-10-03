import React, { useEffect, useRef, useState } from 'react';
import { useFormDataStore } from '../../stores/useFormDataStore';
import { useStepStore } from '../../stores/useStepStore';
import NavigationFlowDebugger from '../debug/NavigationFlowDebugger';
import { coordinateFidelityTester, injectFidelityTest } from '../../utils/coordinate-fidelity-test';

// 🎯 INTERFAZ PARA RESPUESTAS DEL BACKEND
interface BackendResponse {
  questionKey: string;
  response: {
    selectedHitzone?: string;
    selectedImageIndex?: number;
    imageSelections?: Record<string, unknown>;
    clickPosition?: {
      x: number;
      y: number;
      hitzoneWidth: number;
      hitzoneHeight: number;
    };
    // 🎯 NUEVO: PERSISTENCIA DE PUNTOS VISUALES
    visualClickPoints?: VisualClickPoint[];
    [key: string]: unknown;
  };
}

interface ClickPosition {
  x: number;
  y: number;
  hitzoneWidth: number;
  hitzoneHeight: number;
}

// 🎯 NUEVA INTERFACE PARA RASTREO COMPLETO DE CLICS
interface ClickTrackingData {
  x: number;
  y: number;
  timestamp: number;
  hitzoneId?: string; // undefined si el clic fue fuera de hitzone
  imageIndex: number;
  isCorrectHitzone: boolean;
}

// 🎯 NUEVA INTERFACE PARA PUNTOS VISUALES
interface VisualClickPoint {
  x: number;
  y: number;
  timestamp: number;
  isCorrect: boolean;
  imageIndex: number; // 🎯 NUEVO: Para persistir por imagen
}

interface HitZone {
  id: string;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ConvertedHitZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalCoords?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface ImageFile {
  id: string;
  name: string;
  url: string;
  hitZones?: HitZone[];
}

interface NavigationQuestion {
  id: string | number;
  type: string;
  title: string;
  description: string;
  files: ImageFile[];
}

interface NavigationFlowTaskProps {
  stepConfig: NavigationQuestion;
  formData?: Record<string, unknown>;
  currentQuestionKey?: string;
}

const convertHitZonesToPercentageCoordinates = (
  hitZones: HitZone[] | undefined
  // imageNaturalSize?: { width: number; height: number } // Not used
): ConvertedHitZone[] => {
  if (!hitZones || !Array.isArray(hitZones) || hitZones.length === 0) {
    return [];
  }

  return hitZones.map(zone => {
    const { x, y, width, height } = zone.region;
    return {
      id: zone.id,
      x,
      y,
      width,
      height,
      originalCoords: {
        x,
        y,
        width,
        height
      }
    };
  });
};

export const NavigationFlowTask: React.FC<NavigationFlowTaskProps> = ({ stepConfig, currentQuestionKey }) => {
  const navigationQuestion = stepConfig;
  // const id = String(navigationQuestion.id || '').trim(); // Not used
  // const type = String(navigationQuestion.type || 'cognitive_navigation_flow').trim(); // Not used
  const title = navigationQuestion.title || 'Flujo de Navegación';
  const description = navigationQuestion.description || '¿En cuál de las siguientes pantallas encuentras el objetivo indicado?';
  const imageFiles: ImageFile[] = navigationQuestion.files || [];

  const [localSelectedImageIndex, setLocalSelectedImageIndex] = useState<number>(0);
  const [, setLocalSelectedHitzone] = useState<string | null>(null); // Used but never read
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);
  const [imageSelections, setImageSelections] = useState<Record<string, { hitzoneId: string, click: ClickPosition }>>({});
  // 🎯 NUEVO ESTADO PARA RASTREO COMPLETO DE CLICS
  const [allClicksTracking, setAllClicksTracking] = useState<ClickTrackingData[]>([]);
  // 🎯 NUEVO ESTADO PARA PUNTOS VISUALES ROJOS - PERSISTENTES POR IMAGEN
  const [visualClickPoints, setVisualClickPoints] = useState<Record<number, VisualClickPoint[]>>({});
  const imageRef = useRef<HTMLImageElement>(null);

  const images: ImageFile[] = imageFiles;

  // 🎯 CARGAR RESPUESTAS DEL BACKEND SI EXISTEN
  useEffect(() => {
    if (currentQuestionKey) {
      // Buscar respuesta del backend para este step
      const store = useStepStore.getState();
      const backendResponse = store.backendResponses.find(
        (r: unknown): r is BackendResponse => (r as BackendResponse).questionKey === currentQuestionKey
      );

      if (backendResponse?.response) {
        const responseData = backendResponse.response as {
          selectedImageIndex?: number;
          selectedHitzone?: string;
          imageSelections?: Record<string, unknown>;
          visualClickPoints?: unknown[];
        };

        if (responseData.selectedImageIndex !== undefined) {
          setLocalSelectedImageIndex(responseData.selectedImageIndex);
        }
        if (responseData.selectedHitzone) {
          setLocalSelectedHitzone(responseData.selectedHitzone);
        }
        if (responseData.imageSelections) {
          setImageSelections(responseData.imageSelections as Record<string, { hitzoneId: string, click: ClickPosition }>);
        }
        // 🎯 CARGAR PUNTOS VISUALES PERSISTIDOS
        if (responseData.visualClickPoints && Array.isArray(responseData.visualClickPoints)) {
          const pointsByImage: Record<number, VisualClickPoint[]> = {};
          responseData.visualClickPoints.forEach((point: unknown) => {
            const typedPoint = point as VisualClickPoint;
            const imageIndex = typedPoint.imageIndex || 0;
            if (!pointsByImage[imageIndex]) {
              pointsByImage[imageIndex] = [];
            }
            pointsByImage[imageIndex].push(typedPoint);
          });
          setVisualClickPoints(pointsByImage);
          console.log('🎯 Puntos visuales cargados desde backend:', pointsByImage);
        }
      }
    }
  }, [currentQuestionKey]);

  // 🎯 ENVIAR TODOS LOS CLICS AL BACKEND CUANDO SE COMPLETE EL STEP
  useEffect(() => {
    if (currentQuestionKey && allClicksTracking.length > 0) {
      // Enviar todos los clics al backend para análisis
      const { setFormData } = useFormDataStore.getState();
      setFormData(currentQuestionKey, {
        ...useFormDataStore.getState().formData[currentQuestionKey],
        allClicksTracking: allClicksTracking
      });
    }
  }, [allClicksTracking, currentQuestionKey]);

  // 🧪 INYECTAR UTILIDADES DE TEST DE FIDELIDAD AL WINDOW GLOBAL
  useEffect(() => {
    injectFidelityTest();
    console.log('🧪 [NavigationFlowTask] Fidelity test utilities injected for testing');
  }, []);

  // 🎯 FUNCIÓN PARA PERSISTIR PUNTOS VISUALES
  const persistVisualClickPoints = () => {
    if (currentQuestionKey) {
      const { setFormData } = useFormDataStore.getState();
      // Convertir el objeto de puntos por imagen a un array plano para persistir
      const allPoints: VisualClickPoint[] = [];
      Object.entries(visualClickPoints).forEach(([imageIndex, points]) => {
        points.forEach(point => {
          allPoints.push({
            ...point,
            imageIndex: parseInt(imageIndex)
          });
        });
      });

      setFormData(currentQuestionKey, {
        ...useFormDataStore.getState().formData[currentQuestionKey],
        visualClickPoints: allPoints
      });
      console.log('🎯 Puntos visuales persistidos:', allPoints);
    }
  };

  const handleHitzoneClick = (hitzoneId: string, clickPos?: ClickPosition): void => {
    if (clickPos && typeof clickPos.hitzoneWidth === 'number' && typeof clickPos.hitzoneHeight === 'number') {
      setImageSelections(prev => ({
        ...prev,
        [localSelectedImageIndex.toString()]: { hitzoneId, click: clickPos }
      }));

      // 🎯 GUARDAR EN FORMDATA CON TODOS LOS CLICS
      if (currentQuestionKey) {
        const { setFormData } = useFormDataStore.getState();
        setFormData(currentQuestionKey, {
          selectedImageIndex: localSelectedImageIndex,
          selectedHitzone: hitzoneId,
          clickPosition: clickPos,
          imageSelections: {
            ...imageSelections,
            [localSelectedImageIndex.toString()]: { hitzoneId, click: clickPos }
          },
          // 🎯 AGREGAR RASTREO COMPLETO DE CLICS
          allClicksTracking: allClicksTracking
        });
      }

      // 🎯 AVANCE AUTOMÁTICO A LA SIGUIENTE IMAGEN
      if (localSelectedImageIndex < images.length - 1) {
        // Pequeño delay para que el usuario vea el feedback visual
        setTimeout(() => {
          setLocalSelectedImageIndex(localSelectedImageIndex + 1);
          setLocalSelectedHitzone(null);
        }, 500);
      }
    }
  };

  // 🎯 NUEVA FUNCIÓN PARA RASTREAR TODOS LOS CLICS
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>): void => {
    if (!imageRef.current || !imageNaturalSize) return;

    const imgRect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - imgRect.left;
    const clickY = e.clientY - imgRect.top;
    const timestamp = Date.now();

    // 🧪 INICIAR TEST DE FIDELIDAD DE COORDENADAS
    const testId = `nav-flow-${currentQuestionKey}-img-${localSelectedImageIndex}-${timestamp}`;
    coordinateFidelityTester.startTest(testId);
    coordinateFidelityTester.recordOriginalClick(
      testId,
      e.nativeEvent,
      imageRef.current,
      imageNaturalSize,
      imgRenderSize!
    );

    // 🎯 VERIFICAR SI EL CLIC ESTÁ DENTRO DE ALGÚN HITZONE
    let hitzoneId: string | undefined;
    let isCorrectHitzone = false;

    if (availableHitzones.length > 0) {
      for (const hitzone of availableHitzones) {
        const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize!);
        const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
        const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
        const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
        const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);

        if (clickX >= left && clickX <= left + width && clickY >= top && clickY <= top + height) {
          hitzoneId = hitzone.id;
          isCorrectHitzone = true;
          break;
        }
      }
    }

    // 🎯 REGISTRAR EL CLIC
    const clickData: ClickTrackingData = {
      x: clickX,
      y: clickY,
      timestamp,
      hitzoneId,
      imageIndex: localSelectedImageIndex,
      isCorrectHitzone
    };

    setAllClicksTracking(prev => [...prev, clickData]);

    // 🎯 AGREGAR PUNTO VISUAL ROJO - PERSISTENTE POR IMAGEN
    const visualPoint: VisualClickPoint = {
      x: clickX,
      y: clickY,
      timestamp,
      isCorrect: isCorrectHitzone,
      imageIndex: localSelectedImageIndex
    };

    // 🧪 REGISTRAR CLICK PROCESADO PARA TEST DE FIDELIDAD
    coordinateFidelityTester.recordProcessedClick(testId, visualPoint);

    setVisualClickPoints(prev => {
      const newPoints = {
        ...prev,
        [localSelectedImageIndex]: [...(prev[localSelectedImageIndex] || []), visualPoint]
      };

      // 🎯 PERSISTIR INMEDIATAMENTE
      setTimeout(() => persistVisualClickPoints(), 0);

      return newPoints;
    });

    // 🎯 ENVIAR AL BACKEND SI ES UN CLIC EN HITZONE
    if (isCorrectHitzone && hitzoneId) {
      const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize!);
      const relX = clickX - (offsetX + (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width));
      const relY = clickY - (offsetY + (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height));
      const width = (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
      const height = (availableHitzones.find(h => h.id === hitzoneId)?.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);

      handleHitzoneClick(hitzoneId, { x: relX, y: relY, hitzoneWidth: width, hitzoneHeight: height });
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    console.log('🖼️ [NavigationFlowTask] Imagen cargada exitosamente:', {
      url: selectedImage.url,
      naturalSize: { width: naturalWidth, height: naturalHeight },
      renderSize: { width, height }
    });
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImgRenderSize({ width, height });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    console.error('❌ [NavigationFlowTask] Error cargando imagen:', {
      url: selectedImage.url,
      error: e.nativeEvent
    });
  };

  const handlePrevImage = (): void => {
    if (localSelectedImageIndex > 0) {
      setLocalSelectedImageIndex(localSelectedImageIndex - 1);
      setLocalSelectedHitzone(null);
      // 🎯 NO LIMPIAR PUNTOS VISUALES - SE MANTIENEN PERSISTENTES
    }
  };

  const handleNextImage = (): void => {
    // 🎯 VERIFICAR SI SE HA HECHO CLIC EN AL MENOS UN HITZONE DE LA IMAGEN ACTUAL
    const currentImageSelection = imageSelections[localSelectedImageIndex.toString()];
    const hasClickedHitzone = currentImageSelection && currentImageSelection.hitzoneId;

    if (localSelectedImageIndex < images.length - 1 && hasClickedHitzone) {
      setLocalSelectedImageIndex(localSelectedImageIndex + 1);
      setLocalSelectedHitzone(null);
      // 🎯 NO LIMPIAR PUNTOS VISUALES - SE MANTIENEN PERSISTENTES
    }
  };

  const selectedImage: ImageFile = images[localSelectedImageIndex];
  const availableHitzones: ConvertedHitZone[] = selectedImage?.hitZones
    ? convertHitZonesToPercentageCoordinates(selectedImage.hitZones)
    : [];

  // 🔍 DEBUG: Log información de la imagen seleccionada
  React.useEffect(() => {
    if (selectedImage) {
      console.log('🖼️ [NavigationFlowTask] Imagen seleccionada:', {
        index: localSelectedImageIndex,
        id: selectedImage.id,
        name: selectedImage.name,
        url: selectedImage.url,
        hasHitZones: !!selectedImage.hitZones,
        hitZonesCount: selectedImage.hitZones?.length || 0,
        imageNaturalSize,
        imgRenderSize
      });
    } else {
      console.warn('⚠️ [NavigationFlowTask] No hay imagen seleccionada en índice:', localSelectedImageIndex);
    }
  }, [selectedImage, localSelectedImageIndex, imageNaturalSize, imgRenderSize]);

  function getImageDrawRect(
    imgNatural: { width: number; height: number },
    imgRender: { width: number; height: number }
  ): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
    const imgRatio = imgNatural.width / imgNatural.height;
    const renderRatio = imgRender.width / imgRender.height;
    let drawWidth = imgRender.width;
    let drawHeight = imgRender.height;
    let offsetX = 0;
    let offsetY = 0;
    if (imgRatio > renderRatio) {
      drawWidth = imgRender.width;
      drawHeight = imgRender.width / imgRatio;
      offsetY = (imgRender.height - drawHeight) / 2;
    } else {
      drawHeight = imgRender.height;
      drawWidth = imgRender.height * imgRatio;
      offsetX = (imgRender.width - drawWidth) / 2;
    }
    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  // 🎯 OBTENER PUNTOS VISUALES PARA LA IMAGEN ACTUAL
  const currentImageClickPoints = visualClickPoints[localSelectedImageIndex] || [];

  // 🎯 FUNCIONES PARA EL DEBUGGER
  const handleClearPoints = () => {
    setVisualClickPoints({});
    console.log('🧹 Puntos visuales limpiados');
  };

  const handleExportData = () => {
    const exportData = {
      questionKey: currentQuestionKey,
      visualClickPoints: visualClickPoints,
      imageSelections: imageSelections,
      allClicksTracking: allClicksTracking,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Datos exportados:', exportData);

    // Crear archivo de descarga
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `navigation-flow-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col bg-white p-6" data-testid="navigation-flow-task">
      <div className="w-full flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-2">
            {description}
          </p>
          <p className="text-sm text-gray-500 italic">
            Haz clic en una zona interactiva para seleccionarla
          </p>
        </div>

        {images.length > 1 && (
          <div className="flex justify-center items-center gap-4 mb-4">
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={handlePrevImage}
              disabled={localSelectedImageIndex === 0}
            >
              Anterior
            </button>
            <span className="text-sm text-gray-600">
              Imagen {localSelectedImageIndex + 1} de {images.length}
            </span>
            <button
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              onClick={handleNextImage}
              disabled={localSelectedImageIndex === images.length - 1 || !imageSelections[localSelectedImageIndex.toString()]}
            >
              Siguiente
            </button>
          </div>
        )}

        <div
          className="relative w-[80vw] max-w-4xl bg-white rounded-lg shadow-lg"
          style={{ 
            aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : '16/9',
            maxHeight: '85vh', // Aumentar límite de altura
            minHeight: '400px' // Altura mínima para debugging
          }}
        >
          {!selectedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-gray-600">No hay imagen disponible</p>
            </div>
          )}
          {selectedImage && !imageNaturalSize && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Cargando imagen...</p>
                <p className="text-sm text-gray-400">{selectedImage.name}</p>
              </div>
            </div>
          )}
          <img
            ref={imageRef}
            src={selectedImage.url}
            alt={selectedImage.name || `Imagen detallada ${localSelectedImageIndex + 1}`}
            className="w-full h-full object-contain bg-white"
            loading="eager"
            style={{ display: 'block' }}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onClick={handleImageClick}
            crossOrigin="anonymous"
          />
          {imageNaturalSize && imgRenderSize && (
            (() => {
              const { drawWidth, drawHeight, offsetX, offsetY } = getImageDrawRect(imageNaturalSize, imgRenderSize);
              return (
                <div
                  className="absolute top-0 left-0"
                  style={{ width: imgRenderSize.width, height: imgRenderSize.height, pointerEvents: 'none' }}
                >
                  {availableHitzones.map((hitzone: ConvertedHitZone) => {
                    const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
                    const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
                    const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
                    const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);
                    return (
                      <div
                        key={hitzone.id}
                        className="absolute transition-all duration-300"
                        style={{
                          left,
                          top,
                          width,
                          height,
                          pointerEvents: 'auto',
                        }}
                        onClick={e => {
                          e.stopPropagation();
                          // 1. Posición del click respecto a la imagen
                          const imgRect = imageRef.current?.getBoundingClientRect();
                          const clickX = e.clientX - (imgRect?.left ?? 0);
                          const clickY = e.clientY - (imgRect?.top ?? 0);

                          // 🎯 PRIMERO: CREAR PUNTO VISUAL VERDE (CLICK CORRECTO EN HITZONE)
                          const timestamp = Date.now();
                          const visualPoint: VisualClickPoint = {
                            x: clickX,
                            y: clickY,
                            timestamp,
                            isCorrect: true, // Verde porque está en hitzone
                            imageIndex: localSelectedImageIndex
                          };

                          setVisualClickPoints(prev => {
                            const newPoints = {
                              ...prev,
                              [localSelectedImageIndex]: [...(prev[localSelectedImageIndex] || []), visualPoint]
                            };

                            // 🎯 PERSISTIR INMEDIATAMENTE
                            setTimeout(() => persistVisualClickPoints(), 0);

                            return newPoints;
                          });

                          // 🎯 REGISTRAR EN RASTREO COMPLETO
                          const clickData: ClickTrackingData = {
                            x: clickX,
                            y: clickY,
                            timestamp,
                            hitzoneId: hitzone.id,
                            imageIndex: localSelectedImageIndex,
                            isCorrectHitzone: true
                          };

                          setAllClicksTracking(prev => [...prev, clickData]);

                          console.log('🎯 Punto verde creado para click en hitzone:', {
                            hitzoneId: hitzone.id,
                            position: { x: clickX, y: clickY },
                            isCorrect: true
                          });

                          // 2. Posición del hitzone dentro de la imagen renderizada
                          const left = offsetX + (hitzone.originalCoords?.x ?? 0) * (drawWidth / imageNaturalSize.width);
                          const top = offsetY + (hitzone.originalCoords?.y ?? 0) * (drawHeight / imageNaturalSize.height);
                          const width = (hitzone.originalCoords?.width ?? 0) * (drawWidth / imageNaturalSize.width);
                          const height = (hitzone.originalCoords?.height ?? 0) * (drawHeight / imageNaturalSize.height);
                          // 3. Posición relativa al hitzone (en píxeles dentro del hitzone renderizado)
                          const relX = clickX - left;
                          const relY = clickY - top;
                          handleHitzoneClick(hitzone.id, { x: relX, y: relY, hitzoneWidth: width, hitzoneHeight: height });
                        }}
                        title={`Zona interactiva: ${hitzone.id}`}
                      >
                        {/* 🎯 PUNTOS ROJOS ELIMINADOS - SIN FEEDBACK VISUAL */}
                      </div>
                    );
                  })}
                  {availableHitzones.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="bg-white rounded-lg p-4 text-center">
                        <p className="text-gray-600">Esta imagen no tiene zonas interactivas configuradas.</p>
                      </div>
                    </div>
                  )}

                  {/* 🎯 PUNTOS VISUALES ROJOS - PERSISTENTES */}
                  {currentImageClickPoints.map((point, index) => (
                    <div
                      key={`${point.timestamp}-${index}`}
                      className={`absolute w-3 h-3 rounded-full border-2 border-white shadow-lg pointer-events-none ${point.isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      style={{
                        left: point.x - 6,
                        top: point.y - 6,
                        zIndex: 10
                      }}
                      title={`Clic ${point.isCorrect ? 'correcto' : 'incorrecto'} - ${new Date(point.timestamp).toLocaleTimeString()}`}
                    />
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* 🎯 DEBUGGER INTEGRADO */}
      <NavigationFlowDebugger
        currentImageIndex={localSelectedImageIndex}
        visualClickPoints={visualClickPoints}
        onClearPoints={handleClearPoints}
        onExportData={handleExportData}
      />
    </div>
  );
};

export default NavigationFlowTask;
