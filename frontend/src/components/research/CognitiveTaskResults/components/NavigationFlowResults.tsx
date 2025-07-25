import React, { useEffect, useRef, useState } from 'react';
import { useNavigationFlowConfig } from '../../../../hooks/useNavigationFlowConfig';
import { cognitiveTaskService } from '../../../../services/cognitiveTaskService';
import { ConvertedHitZone, HitZone, ImageFile, NavigationFlowResultsProps, VisualClickPoint } from '../types';
import { TransparentOverlay } from './TransparentOverlay';

// 🎯 NUEVO: Interfaz para áreas de calor
interface HeatmapArea {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  clicks: any[];
  isCorrect: boolean;
  colorLevel: 'yellow' | 'orange' | 'red'; // 🎯 NUEVO: Nivel de color progresivo
}

// 🎯 NUEVO: Función para crear heatmaps con intensidad progresiva
const createHeatmapFromClicks = (clicks: any[], radius: number = 14): HeatmapArea[] => {
  if (!clicks || clicks.length === 0) return [];

  const heatmapAreas: HeatmapArea[] = [];
  const processedClicks = new Set<number>();

  clicks.forEach((click, index) => {
    if (processedClicks.has(index)) return;

    const nearbyClicks = [click];
    processedClicks.add(index);

    // Buscar clicks cercanos
    clicks.forEach((otherClick, otherIndex) => {
      if (otherIndex === index || processedClicks.has(otherIndex)) return;

      const distance = Math.sqrt(
        Math.pow(click.x - otherClick.x, 2) + Math.pow(click.y - otherClick.y, 2)
      );

      if (distance <= radius) {
        nearbyClicks.push(otherClick);
        processedClicks.add(otherIndex);
      }
    });

    // Calcular centro del área de calor
    const centerX = nearbyClicks.reduce((sum, c) => sum + c.x, 0) / nearbyClicks.length;
    const centerY = nearbyClicks.reduce((sum, c) => sum + c.y, 0) / nearbyClicks.length;

    // 🎯 NUEVO: Sistema de intensidad progresiva
    const clickCount = nearbyClicks.length;
    let intensity = 0;
    let colorLevel: 'yellow' | 'orange' | 'red' = 'yellow'; // 🟡 Amarillo por defecto

    if (clickCount >= 5) {
      intensity = 1;
      colorLevel = 'red'; // 🔴 Rojo - máxima coincidencia
    } else if (clickCount >= 3) {
      intensity = 0.7;
      colorLevel = 'orange'; // 🟠 Naranja - coincidencia moderada
    } else if (clickCount >= 2) {
      intensity = 0.4;
      colorLevel = 'yellow'; // 🟡 Amarillo - coincidencia inicial
    } else {
      intensity = 0.2;
      colorLevel = 'yellow'; // 🟡 Amarillo - click único
    }

    const isCorrect = nearbyClicks.some(c => c.isCorrectHitzone || c.isCorrect);

    heatmapAreas.push({
      x: centerX,
      y: centerY,
      radius: radius * (1 + intensity * 0.3), // Radio variable según intensidad (reducido de 0.5 a 0.3)
      intensity,
      clicks: nearbyClicks,
      isCorrect,
      colorLevel // 🎯 NUEVO: Nivel de color
    });
  });

  return heatmapAreas;
};

const convertHitZonesToPercentageCoordinates = (
  hitZones: HitZone[] | undefined,
  imageNaturalSize?: { width: number; height: number }
): ConvertedHitZone[] => {
  if (!hitZones || !Array.isArray(hitZones) || hitZones.length === 0) {
    return [];
  }

  return hitZones.map(zone => {
    // Validación defensiva para evitar errores
    if (!zone) {
      console.warn('⚠️ Hitzone inválido:', zone);
      return {
        id: 'unknown',
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }

    // Manejar tanto estructura plana como anidada
    let x, y, width, height;

    if (zone.region) {
      // Estructura anidada: {id, region: {x, y, width, height}}
      const region = zone.region;
      x = region.x || 0;
      y = region.y || 0;
      width = region.width || 0;
      height = region.height || 0;
    } else if ((zone as any).x !== undefined && (zone as any).y !== undefined) {
      // Estructura plana: {id, x, y, width, height}
      x = (zone as any).x || 0;
      y = (zone as any).y || 0;
      width = (zone as any).width || 0;
      height = (zone as any).height || 0;
    } else {
      console.warn('⚠️ Hitzone con estructura desconocida:', zone);
      return {
        id: zone.id || 'unknown',
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }

    if (imageNaturalSize && imageNaturalSize.width > 0 && imageNaturalSize.height > 0) {
      return {
        id: zone.id,
        x: (x / imageNaturalSize.width) * 100,
        y: (y / imageNaturalSize.height) * 100,
        width: (width / imageNaturalSize.width) * 100,
        height: (height / imageNaturalSize.height) * 100,
        originalCoords: { x, y, width, height }
      };
    }

    return {
      id: zone.id,
      x,
      y,
      width,
      height
    };
  });
};

export const NavigationFlowResults: React.FC<NavigationFlowResultsProps> = ({ data }) => {
  const {
    config,
    placeholderImages
  } = useNavigationFlowConfig();

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);
  const [realImages, setRealImages] = useState<ImageFile[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  const [visualClickPoints, setVisualClickPoints] = useState<Record<number, VisualClickPoint[]>>({});
  const [allClicksTracking, setAllClicksTracking] = useState<any[]>([]);
  const [heatmapAreas, setHeatmapAreas] = useState<Record<number, HeatmapArea[]>>({});
  const [showHeatmapMode, setShowHeatmapMode] = useState<boolean>(true);

  const {
    imageSelections,
    selectedImageIndex: finalSelectedImageIndex,
    researchId,
    visualClickPoints: backendVisualClickPoints
  } = data;

  // 🎯 PROCESAR DATOS DE NAVEGACIÓN
  useEffect(() => {
    if (data) {
      if (Array.isArray(data)) {
        const allClicks: any[] = [];
        const allVisualPoints: Record<number, VisualClickPoint[]> = {};

        data.forEach((participant, participantIndex) => {
          if (participant.responses && Array.isArray(participant.responses)) {
            participant.responses.forEach((response: any, responseIndex: number) => {
              if (response.questionKey === 'cognitive_navigation_flow') {
                const responseData = response.response || response;
                if (responseData.visualClickPoints && Array.isArray(responseData.visualClickPoints)) {
                  responseData.visualClickPoints.forEach((point: VisualClickPoint) => {
                    const imageIndex = point.imageIndex || 0;
                    if (!allVisualPoints[imageIndex]) {
                      allVisualPoints[imageIndex] = [];
                    }
                    allVisualPoints[imageIndex].push({
                      ...point,
                      participantId: participant.participantId
                    });
                  });
                }

                // Procesar allClicksTracking si existen
                if (responseData.allClicksTracking && Array.isArray(responseData.allClicksTracking)) {
                  responseData.allClicksTracking.forEach((click: any) => {
                    allClicks.push({
                      ...click,
                      participantId: participant.participantId
                    });
                  });
                }
              }
            });
          }
        });

        if (allClicks.length === 0 && Object.keys(allVisualPoints).length === 0) {
          const exampleClicks = [
            { x: 200, y: 150, timestamp: Date.now(), imageIndex: 0, isCorrectHitzone: true, participantId: 'ejemplo-1' },
            { x: 300, y: 200, timestamp: Date.now(), imageIndex: 0, isCorrectHitzone: false, participantId: 'ejemplo-1' },
            { x: 400, y: 250, timestamp: Date.now(), imageIndex: 0, isCorrectHitzone: true, participantId: 'ejemplo-2' },
            { x: 150, y: 300, timestamp: Date.now(), imageIndex: 0, isCorrectHitzone: false, participantId: 'ejemplo-2' }
          ];

          setAllClicksTracking(exampleClicks);
        } else {
          setAllClicksTracking(allClicks);
          setVisualClickPoints(allVisualPoints);

          // 🎯 NUEVO: Crear heatmaps para cada imagen
          const newHeatmapAreas: Record<number, HeatmapArea[]> = {};
          Object.keys(allVisualPoints).forEach(imageIndexStr => {
            const imageIndex = parseInt(imageIndexStr);
            const clicksForImage = allClicks.filter(click => click.imageIndex === imageIndex);
            if (clicksForImage.length > 0) {
              newHeatmapAreas[imageIndex] = createHeatmapFromClicks(clicksForImage);
            }
          });
          setHeatmapAreas(newHeatmapAreas);
        }
      } else {

        const allClicks: any[] = [];
        const allVisualPoints: Record<number, VisualClickPoint[]> = {};

        // Procesar visualClickPoints si existen
        if (data.visualClickPoints && Array.isArray(data.visualClickPoints)) {
          data.visualClickPoints.forEach((point: VisualClickPoint) => {
            const imageIndex = point.imageIndex || 0;
            if (!allVisualPoints[imageIndex]) {
              allVisualPoints[imageIndex] = [];
            }
            allVisualPoints[imageIndex].push({
              ...point,
              participantId: 'participante-1' // Asignar un ID por defecto
            });
          });
        }

        if (data.allClicksTracking && Array.isArray(data.allClicksTracking)) {
          data.allClicksTracking.forEach((click: any) => {
            allClicks.push({
              ...click,
              participantId: 'participante-1' // Asignar un ID por defecto
            });
          });
        }

        if (allClicks.length > 0 || Object.keys(allVisualPoints).length > 0) {
          setAllClicksTracking(allClicks);
          setVisualClickPoints(allVisualPoints);

          // 🎯 NUEVO: Crear heatmaps para cada imagen
          const newHeatmapAreas: Record<number, HeatmapArea[]> = {};
          Object.keys(allVisualPoints).forEach(imageIndexStr => {
            const imageIndex = parseInt(imageIndexStr);
            const clicksForImage = allClicks.filter(click => click.imageIndex === imageIndex);
            if (clicksForImage.length > 0) {
              newHeatmapAreas[imageIndex] = createHeatmapFromClicks(clicksForImage);
            }
          });
          setHeatmapAreas(newHeatmapAreas);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    const loadRealImages = async () => {
      if (!researchId) {
        setLoadingImages(false);
        return;
      }

      try {
        setLoadingImages(true);
        const cognitiveTask = await cognitiveTaskService.getByResearchId(researchId);

        if (cognitiveTask?.questions) {
          const navigationQuestion = cognitiveTask.questions.find((q: any) =>
            q.type === 'cognitive_navigation_flow' || q.questionKey === 'cognitive_navigation_flow'
          ) as any;

          if (navigationQuestion?.files && navigationQuestion.files.length > 0) {
            const imagesWithHitzones: ImageFile[] = navigationQuestion.files.map((file: any, index: number) => {
              return {
                id: file.id || String(index + 1),
                name: file.name || `Imagen ${index + 1}`,
                url: file.url || file.s3Key || '',
                hitZones: file.hitZones || []
              };
            });

            setRealImages(imagesWithHitzones);
          } else {
            setRealImages(placeholderImages);
          }
        } else {
          setRealImages(placeholderImages);
        }
      } catch (error) {
        console.error('Error cargando imágenes reales:', error);
        setRealImages(placeholderImages);
      } finally {
        setLoadingImages(false);
      }
    };

    loadRealImages();
  }, [researchId]);

  const currentImageIndex = selectedImageIndex ?? finalSelectedImageIndex ?? 0;

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    setImageNaturalSize({ width: naturalWidth, height: naturalHeight });
    setImgRenderSize({ width, height });
  };

  function getImageDrawRect(
    imgNatural: { width: number, height: number },
    imgRender: { width: number, height: number }
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

  const selectedImage: ImageFile = realImages[currentImageIndex];
  const availableHitzones: ConvertedHitZone[] = selectedImage?.hitZones && Array.isArray(selectedImage.hitZones)
    ? convertHitZonesToPercentageCoordinates(selectedImage.hitZones, imageNaturalSize || undefined)
    : [];

  const currentImageClickPoints = visualClickPoints[currentImageIndex] || [];

  if (!data || realImages.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No hay datos de tareas cognitivas disponibles.</p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
          <h5 className="font-semibold text-yellow-800 mb-2">Debug Info:</h5>
          <pre className="text-xs text-yellow-700 overflow-auto">
            {JSON.stringify({
              data: !!data,
              dataLength: Array.isArray(data) ? data.length : 'No es array',
              imagesLength: realImages.length,
              finalSelectedImageIndex,
              imageSelections: Object.keys(imageSelections),
              loadingImages,
              visualClickPoints: Object.keys(visualClickPoints),
              allClicksTracking: allClicksTracking?.length,
              participants: Array.isArray(data) ? data.map(p => p.participantId) : []
            }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Información de participantes */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Datos de Navegación
            </h3>
            <p className="text-xs text-blue-600">
              {Array.isArray(data) ? `${data.length} participantes` : '1 participante'} •
              {allClicksTracking.length} clics totales •
              {Object.keys(visualClickPoints).length} imágenes con datos
            </p>
            {/* 🎯 DEBUG: Mostrar información adicional */}
            <p className="text-xs text-red-600 mt-1">
              DEBUG: allClicksTracking.length = {allClicksTracking.length} | visualClickPoints keys = {Object.keys(visualClickPoints).join(', ')}
            </p>
            {/* 🎯 NUEVO: Control de modo de visualización */}
            <div className="mt-2 flex items-center space-x-2">
              <button
                onClick={() => setShowHeatmapMode(!showHeatmapMode)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${showHeatmapMode
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {showHeatmapMode ? '🌡️ Heatmap' : '🔘 Clicks'}
              </button>
              {showHeatmapMode && heatmapAreas[currentImageIndex] && (
                <span className="text-xs text-blue-600">
                  {heatmapAreas[currentImageIndex].length} áreas de calor
                </span>
              )}
              {/* 🎯 NUEVO: Leyenda de colores */}
              {showHeatmapMode && (
                <div className="mt-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span>🟡 Inicial</span>
                    <span>🟠 Moderada</span>
                    <span>🔴 Máxima</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="text-xs text-blue-600">
            {Array.isArray(data) && data.map((p, i) => (
              <span key={p.participantId} className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded mr-1 mb-1">
                P{i + 1}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Seleccionar Imagen */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Imagen
        </label>
        <div className="flex space-x-2">
          {realImages.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedImageIndex(index);
              }}
              className={`px-4 py-2 rounded-lg border transition-colors ${currentImageIndex === index
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              Imagen {index + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div
          className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden"
          style={{ aspectRatio: imageNaturalSize ? `${imageNaturalSize.width} / ${imageNaturalSize.height}` : undefined }}
        >
          {loadingImages ? (
            <div className="flex items-center justify-center h-64 bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Cargando imagen real...</p>
              </div>
            </div>
          ) : (
            <>
              <img
                ref={imageRef}
                src={selectedImage.url}
                alt={selectedImage.name || `Imagen ${currentImageIndex + 1}`}
                className="w-full h-auto object-contain bg-white"
                loading="lazy"
                style={{ display: 'block' }}
                onLoad={handleImageLoad}
              />
              {/* Capa transparente azulada con 30% de opacidad */}
              <TransparentOverlay />
            </>
          )}

          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded z-20">
            {loadingImages ? 'Cargando...' : `Imagen ${currentImageIndex + 1}`}
          </div>

          {imageNaturalSize && imgRenderSize && !loadingImages && (
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
                          pointerEvents: 'none',
                        }}
                        title={`Zona interactiva: ${hitzone.id}`}
                      >
                      </div>
                    );
                  })}

                  {config.showHeatmap && !showHeatmapMode && currentImageClickPoints.length > 0 && (
                    <>
                      {currentImageClickPoints.map((point, index) => {

                        if ((point.isCorrect && !config.showCorrectClicks) ||
                          (!point.isCorrect && !config.showIncorrectClicks)) {
                          return null;
                        }

                        return (
                          <div
                            key={`${point.timestamp}-${index}`}
                            className={`absolute w-2 h-2 rounded-full border border-white shadow-sm pointer-events-none ${point.isCorrect ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            style={{
                              left: point.x - 4,
                              top: point.y - 4,
                              zIndex: 10
                            }}
                            title={`Clic ${point.isCorrect ? 'correcto' : 'incorrecto'} - ${new Date(point.timestamp).toLocaleTimeString()}`}
                          />
                        );
                      })}
                    </>
                  )}

                  {config.showHeatmap && !showHeatmapMode && allClicksTracking && Array.isArray(allClicksTracking) && (
                    <>
                      {allClicksTracking
                        .filter(click => click.imageIndex === currentImageIndex)
                        .map((click, index) => {
                          if ((click.isCorrectHitzone && !config.showCorrectClicks) ||
                            (!click.isCorrectHitzone && !config.showIncorrectClicks)) {
                            return null;
                          }

                          return (
                            <div
                              key={`${click.timestamp}-${index}`}
                              className={`absolute w-2 h-2 rounded-full border border-white shadow-sm pointer-events-none ${click.isCorrectHitzone ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              style={{
                                left: click.x - 4,
                                top: click.y - 4,
                                zIndex: 10
                              }}
                              title={`Clic ${click.isCorrectHitzone ? 'correcto' : 'incorrecto'} - ${new Date(click.timestamp).toLocaleTimeString()}`}
                            />
                          );
                        })}
                    </>
                  )}

                  {/* 🎯 NUEVO: RENDERIZAR HEATMAPS */}
                  {showHeatmapMode && heatmapAreas[currentImageIndex] && heatmapAreas[currentImageIndex].length > 0 && (
                    <>
                      {heatmapAreas[currentImageIndex].map((area, index) => {
                        if ((area.isCorrect && !config.showCorrectClicks) ||
                          (!area.isCorrect && !config.showIncorrectClicks)) {
                          return null;
                        }

                        const left = offsetX + area.x - area.radius;
                        const top = offsetY + area.y - area.radius;
                        const diameter = area.radius * 2;

                        return (
                          <div
                            key={`heatmap-${index}`}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                              left,
                              top,
                              width: diameter,
                              height: diameter,
                              background: (() => {
                                // 🎯 NUEVO: Sistema de colores progresivos con 90% de intensidad
                                const baseOpacity = area.colorLevel === 'yellow' ? 0.6 : 0.7; // Aumentado a ~90% de intensidad
                                const intensityOpacity = area.intensity * 0.2; // Reducido para no exceder 90%

                                switch (area.colorLevel) {
                                  case 'red':
                                    return `radial-gradient(circle, rgba(239, 68, 68, ${baseOpacity + intensityOpacity}) 0%, rgba(239, 68, 68, ${0.3 + intensityOpacity * 0.3}) 70%, transparent 100%)`;
                                  case 'orange':
                                    return `radial-gradient(circle, rgba(249, 115, 22, ${baseOpacity + intensityOpacity}) 0%, rgba(249, 115, 22, ${0.3 + intensityOpacity * 0.3}) 70%, transparent 100%)`;
                                  case 'yellow':
                                  default:
                                    return `radial-gradient(circle, rgba(234, 179, 8, ${baseOpacity + intensityOpacity}) 0%, rgba(234, 179, 8, ${0.3 + intensityOpacity * 0.3}) 70%, transparent 100%)`;
                                }
                              })(),
                              border: 'none', // 🎯 NUEVO: Sin bordes
                              zIndex: 15
                            }}
                            title={`Área de calor - ${area.clicks.length} clicks - Nivel: ${area.colorLevel === 'red' ? '🔴 Máxima coincidencia' : area.colorLevel === 'orange' ? '🟠 Coincidencia moderada' : '🟡 Coincidencia inicial'}`}
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};
