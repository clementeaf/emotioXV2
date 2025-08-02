import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigationFlowConfig } from '../../../../hooks/useNavigationFlowConfig';
import { ConvertedHitZone, HitZone, ImageFile, NavigationFlowResultsProps } from '../types';
import { TransparentOverlay } from './TransparentOverlay';

// 🎯 NUEVO: Interfaz para áreas de calor
interface HeatmapArea {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  clicks: any[];
  isCorrect: boolean;
  colorLevel: 'yellow' | 'orange' | 'red';
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
    let colorLevel: 'yellow' | 'orange' | 'red' = 'yellow';

    if (clickCount >= 5) {
      intensity = 1;
      colorLevel = 'red';
    } else if (clickCount >= 3) {
      intensity = 0.7;
      colorLevel = 'orange';
    } else if (clickCount >= 2) {
      intensity = 0.4;
      colorLevel = 'yellow';
    } else {
      intensity = 0.2;
      colorLevel = 'yellow';
    }

    const isCorrect = nearbyClicks.some(c => c.isCorrectHitzone || c.isCorrect);

    heatmapAreas.push({
      x: centerX,
      y: centerY,
      radius: radius * (1 + intensity * 0.3),
      intensity,
      clicks: nearbyClicks,
      isCorrect,
      colorLevel
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
    if (!zone) {
      console.warn('⚠️ Hitzone inválido:', zone);
      return {
        id: 'unknown',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originalCoords: { x: 0, y: 0, width: 0, height: 0 }
      };
    }

    if (!imageNaturalSize) {
      console.warn('⚠️ Tamaño de imagen no disponible para hitzone:', zone);
      return {
        id: zone.id || 'unknown',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        originalCoords: { x: 0, y: 0, width: 0, height: 0 }
      };
    }

    const x = (zone.region.x / imageNaturalSize.width) * 100;
    const y = (zone.region.y / imageNaturalSize.height) * 100;
    const width = (zone.region.width / imageNaturalSize.width) * 100;
    const height = (zone.region.height / imageNaturalSize.height) * 100;

    return {
      id: zone.id || 'unknown',
      x,
      y,
      width,
      height,
      originalCoords: { x: zone.region.x, y: zone.region.y, width: zone.region.width, height: zone.region.height }
    };
  });
};

export const NavigationFlowResults: React.FC<NavigationFlowResultsProps> = ({ data }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [expandedImageId, setExpandedImageId] = useState<string | null>(null);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);
  const [loadingImages, setLoadingImages] = useState<boolean>(true);
  const [realImages, setRealImages] = useState<ImageFile[]>([]);
  const [placeholderImages, setPlaceholderImages] = useState<ImageFile[]>([]);
  const [showHeatmapMode, setShowHeatmapMode] = useState<boolean>(true);

  const imageRef = useRef<HTMLImageElement>(null);
  const { config } = useNavigationFlowConfig();

  // Funciones para manejar la vista de selección de imágenes
  const handleImageSelect = (imageIndex: number) => {
    setSelectedImageIndex(imageIndex);
  };

  const handleImageExpand = (imageId: string) => {
    setExpandedImageId(expandedImageId === imageId ? null : imageId);
  };

  // 🎯 PROCESAR DATOS DE NAVEGACIÓN
  const {
    visualClickPoints: backendVisualClickPoints,
    allClicksTracking,
    imageSelections
  } = data;

  // 🎯 OBTENER IMÁGENES REALES DEL BACKEND
  const backendImages = useMemo(() => {
    if (imageSelections && typeof imageSelections === 'object') {
      return Object.keys(imageSelections).map(key => key);
    }
    // Fallback: usar datos simulados si no hay datos reales
    return ['image1', 'image2', 'image3'];
  }, [imageSelections]);

  // 🎯 OBTENER HITZONES REALES DEL BACKEND
  const backendHitZones = useMemo(() => {
    // Extraer hitzones de los datos de selección de imágenes
    const hitzones: HitZone[] = [];
    if (imageSelections && typeof imageSelections === 'object') {
      Object.values(imageSelections).forEach((selection: any) => {
        if (selection && selection.hitzoneId) {
          hitzones.push({
            id: selection.hitzoneId,
            region: {
              x: selection.click?.x || 0,
              y: selection.click?.y || 0,
              width: selection.click?.hitzoneWidth || 100,
              height: selection.click?.hitzoneHeight || 100
            }
          });
        }
      });
    }
    return hitzones;
  }, [imageSelections]);

  // 🎯 CONVERTIR HITZONES A COORDENADAS DE PORCENTAJE
  const availableHitzones = convertHitZonesToPercentageCoordinates(backendHitZones, imageNaturalSize || undefined);

  // 🎯 PROCESAR CLICKS VISUALES
  const currentImageClickPoints = backendVisualClickPoints?.filter(
    point => point.imageIndex === selectedImageIndex
  ) || [];

  // 🎯 CREAR HEATMAPS
  const heatmapAreas = useMemo(() => {
    if (allClicksTracking && Array.isArray(allClicksTracking)) {
      const heatmaps: { [key: number]: HeatmapArea[] } = {};

      // Agrupar clicks por imagen
      const clicksByImage: { [key: number]: any[] } = {};
      allClicksTracking.forEach(click => {
        if (!clicksByImage[click.imageIndex]) {
          clicksByImage[click.imageIndex] = [];
        }
        clicksByImage[click.imageIndex].push(click);
      });

      // Crear heatmaps para cada imagen
      Object.keys(clicksByImage).forEach(imageIndexStr => {
        const imageIndex = parseInt(imageIndexStr);
        heatmaps[imageIndex] = createHeatmapFromClicks(clicksByImage[imageIndex]);
      });

      return heatmaps;
    }
    return {};
  }, [allClicksTracking]);

  // 🎯 CARGAR IMÁGENES REALES
  useEffect(() => {
    const loadRealImages = async () => {
      if (backendImages && backendImages.length > 0) {
        setLoadingImages(true);
        try {
          const imagePromises = backendImages.map(async (imageId: string) => {
            // Usar URLs reales de S3 para las imágenes
            const s3Url = `https://emotiox-v2-dev-storage.s3.us-east-1.amazonaws.com/${imageId}`;

            return {
              id: imageId,
              name: `Imagen ${imageId}`,
              url: s3Url
            };
          });

          const loadedImages = await Promise.all(imagePromises);
          setRealImages(loadedImages);
        } catch (error) {
          console.error('Error loading images:', error);
        } finally {
          setLoadingImages(false);
        }
      } else {
        setLoadingImages(false);
      }
    };

    loadRealImages();
  }, [backendImages, imageSelections]);

  // 🎯 MANEJAR CARGA DE IMAGEN
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>): void => {
    const img = e.currentTarget;
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImgRenderSize({ width: img.offsetWidth, height: img.offsetHeight });
  };

  // 🎯 FUNCIÓN PARA CALCULAR RECTÁNGULO DE DIBUJO
  function getImageDrawRect(
    imgNatural: { width: number, height: number },
    imgRender: { width: number, height: number }
  ): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
    const naturalAspect = imgNatural.width / imgNatural.height;
    const renderAspect = imgRender.width / imgRender.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (naturalAspect > renderAspect) {
      // Imagen más ancha que el contenedor
      drawWidth = imgRender.width;
      drawHeight = imgRender.width / naturalAspect;
      offsetX = 0;
      offsetY = (imgRender.height - drawHeight) / 2;
    } else {
      // Imagen más alta que el contenedor
      drawHeight = imgRender.height;
      drawWidth = imgRender.height * naturalAspect;
      offsetX = (imgRender.width - drawWidth) / 2;
      offsetY = 0;
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
  }

  const currentImageIndex = selectedImageIndex;
  const selectedImage = realImages[currentImageIndex] || placeholderImages[currentImageIndex] || {
    id: 'placeholder',
    name: 'Placeholder',
    url: '/placeholder.jpg'
  };

  return (
    <div className="space-y-6 p-6">
      {/* Vista de selección de imágenes con acordeón */}
      <div className="space-y-4">
        {realImages.map((image, index) => {
          const stepNumber = index + 1;
          const isExpanded = expandedImageId === image.id;
          const images = realImages.length > 0 ? realImages : placeholderImages;

          return (
            <div key={image.id || `step-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
              {/* Step Header */}
              <div className="flex items-center space-x-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-gray-100 border flex-shrink-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                    <div className="w-6 h-0.5 bg-gray-500"></div>
                  </div>
                </div>

                {/* Step Label */}
                <div className="flex-1">
                  <h4 className="text-md font-medium text-gray-900">Imagen {stepNumber}</h4>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${[25, 70, 90][index] || 50}%` }}
                    ></div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600">15s</span>
                  <span className="text-blue-600 font-medium">100%</span>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-600">47</span>
                  </div>
                </div>

                {/* Show Details Button */}
                <button
                  onClick={() => handleImageExpand(image.id)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {isExpanded ? 'Hide details' : 'Show details'}
                </button>
              </div>

              {/* Expanded Details - Heatmap completo */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {/* Header con información de la prueba */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">Step {stepNumber} and task description</h3>
                    </div>
                  </div>

                  {/* Banner de datos nuevos */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-800 text-sm">New data was obtained. Please update graph</span>
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                        Update
                      </button>
                    </div>
                  </div>

                  {/* Filtros de visualización */}
                  <div className="mb-4">
                    <div className="flex space-x-2">
                      {[
                        { id: 'heat-click-map', label: 'Heat click map', active: true },
                        { id: 'click-map', label: 'Click map', active: false },
                        { id: 'opacity-map', label: 'Opacity map', active: false },
                        { id: 'scan-path', label: 'Scan Path', active: false },
                        { id: 'image', label: 'Image', active: false },
                        { id: 'prediction', label: 'Prediction', active: false }
                      ].map((filter) => (
                        <button
                          key={filter.id}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${filter.active
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout principal con imagen y panel lateral */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Panel principal con imagen */}
                    <div className="lg:col-span-3">
                      {/* Seleccionar Imagen */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar Imagen
                        </label>
                        <div className="flex space-x-2">
                          {images.map((img, imgIndex) => (
                            <button
                              key={imgIndex}
                              onClick={() => {
                                setSelectedImageIndex(imgIndex);
                              }}
                              className={`px-4 py-2 rounded-lg border transition-colors ${currentImageIndex === imgIndex
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                              Imagen {imgIndex + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div
                          className="relative w-full bg-white rounded-lg shadow-lg overflow-hidden"
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
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  // Fallback a placeholder si la imagen falla
                                  const fallbackDiv = document.createElement('div');
                                  fallbackDiv.className = 'w-full h-64 bg-gray-100 flex items-center justify-center';
                                  fallbackDiv.innerHTML = `
                                    <div class="text-center">
                                      <div class="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                                        <div class="w-16 h-16 bg-gray-300 rounded flex items-center justify-center">
                                          <div class="w-8 h-0.5 bg-gray-500"></div>
                                        </div>
                                      </div>
                                      <p class="text-gray-600 text-lg font-medium">${selectedImage.name || `Imagen ${currentImageIndex + 1}`}</p>
                                      <p class="text-gray-500 text-sm">Imagen no disponible</p>
                                    </div>
                                  `;
                                  target.parentNode?.appendChild(fallbackDiv);
                                }}
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
                                      {currentImageClickPoints.map((point, pointIndex) => {
                                        if ((point.isCorrect && !config.showCorrectClicks) ||
                                          (!point.isCorrect && !config.showIncorrectClicks)) {
                                          return null;
                                        }

                                        return (
                                          <div
                                            key={`${point.timestamp}-${pointIndex}`}
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
                                        .map((click, clickIndex) => {
                                          if ((click.isCorrectHitzone && !config.showCorrectClicks) ||
                                            (!click.isCorrectHitzone && !config.showIncorrectClicks)) {
                                            return null;
                                          }

                                          return (
                                            <div
                                              key={`${click.timestamp}-${clickIndex}`}
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
                                      {heatmapAreas[currentImageIndex].map((area, areaIndex) => {
                                        if ((area.isCorrect && !config.showCorrectClicks) ||
                                          (!area.isCorrect && !config.showIncorrectClicks)) {
                                          return null;
                                        }

                                        const left = offsetX + area.x - area.radius;
                                        const top = offsetY + area.y - area.radius;
                                        const diameter = area.radius * 2;

                                        return (
                                          <div
                                            key={`heatmap-${areaIndex}`}
                                            className="absolute rounded-full pointer-events-none"
                                            style={{
                                              left,
                                              top,
                                              width: diameter,
                                              height: diameter,
                                              background: (() => {
                                                const baseOpacity = area.colorLevel === 'yellow' ? 0.6 : 0.7;
                                                const intensityOpacity = area.intensity * 0.2;

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
                                              border: 'none',
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

                    {/* Panel lateral con Areas of Interest */}
                    <div className="lg:col-span-1">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Areas of Interest (AOI)</h4>
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((aoiIndex) => (
                            <div key={aoiIndex} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                              {/* Thumbnail */}
                              <div className="w-12 h-12 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                                <div className="w-full h-full bg-yellow-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-600">AOI</span>
                                </div>
                              </div>

                              {/* Métricas */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">Area of Interest (AOI) #{aoiIndex}</div>
                                <div className="flex items-center space-x-2 text-xs text-gray-600">
                                  <span>6s</span>
                                  <span>14%</span>
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>05</span>
                                  </div>
                                </div>
                              </div>

                              {/* Botón Remove */}
                              <button className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                Remove AOI
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
