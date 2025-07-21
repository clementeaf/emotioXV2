import React, { useEffect, useRef, useState } from 'react';
import { cognitiveTaskService } from '../../../../services/cognitiveTaskService';

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

export interface NavigationFlowData {
  question: string;
  description?: string;
  totalParticipants: number;
  totalSelections: number;
  researchId?: string;
  imageSelections: {
    [imageIndex: string]: {
      hitzoneId: string;
      click: {
        x: number;
        y: number;
        hitzoneWidth: number;
        hitzoneHeight: number;
      };
    };
  };
  selectedHitzone?: string;
  clickPosition?: {
    x: number;
    y: number;
    hitzoneWidth: number;
    hitzoneHeight: number;
  };
  selectedImageIndex?: number;
}

interface NavigationFlowResultsProps {
  data: NavigationFlowData;
}

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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [imgRenderSize, setImgRenderSize] = useState<{ width: number; height: number } | null>(null);
  const [realImages, setRealImages] = useState<ImageFile[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);

  // Usar los datos que ya están procesados
  const {
    question,
    description,
    totalParticipants,
    totalSelections,
    imageSelections,
    selectedHitzone,
    clickPosition,
    selectedImageIndex: finalSelectedImageIndex,
    researchId
  } = data;

  // Cargar imágenes reales desde el cognitive task
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
            // Convertir los archivos a ImageFile con hitzones
            const imagesWithHitzones: ImageFile[] = navigationQuestion.files.map((file: any, index: number) => {
              console.log(`📋 Archivo ${index + 1}:`, {
                name: file.name,
                hitZones: file.hitZones,
                hitZonesLength: file.hitZones?.length,
                hitZonesStructure: file.hitZones?.[0]
              });
              return {
                id: file.id || String(index + 1),
                name: file.name || `Imagen ${index + 1}`,
                url: file.url || file.s3Key || '',
                hitZones: file.hitZones || []
              };
            });

            console.log('🖼️ Imágenes con hitzones creadas:', imagesWithHitzones);
            console.log('🔗 URLs de imágenes:', imagesWithHitzones.map(img => ({ name: img.name, url: img.url })));
            setRealImages(imagesWithHitzones);
          } else {
            // Fallback a imágenes placeholder si no hay archivos
            setRealImages([
              { id: '1', name: 'Imagen 1', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 1</text></svg>', hitZones: [] },
              { id: '2', name: 'Imagen 2', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 2</text></svg>', hitZones: [] },
              { id: '3', name: 'Imagen 3', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 3</text></svg>', hitZones: [] }
            ]);
          }
        } else {
          // Fallback a imágenes placeholder
          setRealImages([
            { id: '1', name: 'Imagen 1', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 1</text></svg>', hitZones: [] },
            { id: '2', name: 'Imagen 2', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 2</text></svg>', hitZones: [] },
            { id: '3', name: 'Imagen 3', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 3</text></svg>', hitZones: [] }
          ]);
        }
      } catch (error) {
        console.error('Error cargando imágenes reales:', error);
        // Fallback a imágenes placeholder
        setRealImages([
          { id: '1', name: 'Imagen 1', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 1</text></svg>', hitZones: [] },
          { id: '2', name: 'Imagen 2', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 2</text></svg>', hitZones: [] },
          { id: '3', name: 'Imagen 3', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><text x="400" y="300" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="%23666">Imagen 3</text></svg>', hitZones: [] }
        ]);
      } finally {
        setLoadingImages(false);
      }
    };

    loadRealImages();
  }, [researchId]);

  // Usar el selectedImageIndex del backend como prioridad, pero permitir selección manual
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

  console.log('🎯 Hitzones disponibles:', {
    selectedImage: selectedImage?.name,
    hitZones: selectedImage?.hitZones,
    hitZonesLength: selectedImage?.hitZones?.length,
    hitZonesStructure: selectedImage?.hitZones?.[0],
    availableHitzones: availableHitzones.length,
    imageNaturalSize,
    imgRenderSize
  });

  const currentSelection = imageSelections[currentImageIndex.toString()];

  console.log('🔍 NavigationFlowResults Debug:', {
    selectedImageIndex,
    finalSelectedImageIndex,
    currentImageIndex,
    imageSelections,
    images: realImages.length,
    'selectedImageIndex from backend': finalSelectedImageIndex,
    'will show image': currentImageIndex,
    'data received': !!data,
    'loadingImages': loadingImages,
    'selectedImage': selectedImage,
    'availableHitzones': availableHitzones.length,
    'currentSelection': currentSelection,
    'showHeatmap': showHeatmap
  });

  if (!data || realImages.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No hay datos de tareas cognitivas disponibles.</p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
          <h5 className="font-semibold text-yellow-800 mb-2">Debug Info:</h5>
          <pre className="text-xs text-yellow-700 overflow-auto">
            {JSON.stringify({
              data: !!data,
              imagesLength: realImages.length,
              finalSelectedImageIndex,
              imageSelections: Object.keys(imageSelections),
              loadingImages
            }, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
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
                console.log('🖱️ Click en imagen:', index);
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

      {/* Área de visualización */}
      <div className="mb-6">
        {/* Contenedor de imagen */}
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
            <img
              ref={imageRef}
              src={selectedImage.url}
              alt={selectedImage.name || `Imagen ${currentImageIndex + 1}`}
              className="w-full h-auto object-contain bg-white"
              loading="lazy"
              style={{ display: 'block' }}
              onLoad={handleImageLoad}
            />
          )}

          {/* Badge de demostración */}
          <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded z-20">
            {loadingImages ? 'Cargando...' : `Imagen ${currentImageIndex + 1}`}
          </div>

          {/* Renderizado de hitzones y clicks */}
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

                    console.log('🎯 Renderizando hitzone:', {
                      hitzoneId: hitzone.id,
                      originalCoords: hitzone.originalCoords,
                      left,
                      top,
                      width,
                      height,
                      drawWidth,
                      drawHeight,
                      offsetX,
                      offsetY
                    });

                    return (
                      <div
                        key={hitzone.id}
                        className="absolute border-2 border-blue-400 bg-blue-500 bg-opacity-10"
                        style={{
                          left,
                          top,
                          width,
                          height,
                          pointerEvents: 'none',
                        }}
                      >
                        {/* Renderizar click si existe para este hitzone */}
                        {currentSelection && currentSelection.hitzoneId === hitzone.id && currentSelection.click && (
                          <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                            <div
                              className="absolute bg-red-600 rounded-full border-2 border-white shadow"
                              style={{
                                left: `calc(${currentSelection.click.x}px - 6px)`,
                                top: `calc(${currentSelection.click.y}px - 6px)`,
                                width: 12,
                                height: 12
                              }}
                              title="Punto de click"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      </div>

    </div>
  );
};
