'use client';

import { cognitiveTaskService } from '@/services/cognitiveTaskService';
import s3Service from '@/services/s3Service';
import { useEffect, useState } from 'react';

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

export function NavigationFlowResults({ data }: NavigationFlowResultsProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [realImages, setRealImages] = useState<string[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);

  // Usar una imagen base64 inline como fallback (igual que el modal cuando hay error)
  const fallbackImageUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="%23f8fafc"/><rect x="50" y="50" width="700" height="100" fill="%2322c55e" rx="8"/><text x="400" y="105" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="white">modelo</text><rect x="50" y="170" width="700" height="380" fill="%23fbbf24" rx="8"/><rect x="350" y="350" width="100" height="40" fill="%2322c55e" rx="6"/><text x="400" y="370" font-family="Arial" font-size="14" text-anchor="middle" dominant-baseline="middle" fill="white">Continuar</text></svg>';
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null);
  const [imgNatural, setImgNatural] = useState<{ width: number; height: number } | null>(null);

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
          const navigationQuestion = cognitiveTask.questions.find(q =>
            (typeof q.type === 'string' && q.type.includes('navigation_flow'))
          );

          if (navigationQuestion?.files && navigationQuestion.files.length > 0) {
            const imageUrls = await Promise.all(
              navigationQuestion.files.map(async (file) => {
                if (file.s3Key) {
                  try {
                    return await s3Service.getDownloadUrl(file.s3Key);
                  } catch (error) {
                    console.error('Error obteniendo URL de imagen:', error);
                    return fallbackImageUrl;
                  }
                }
                return file.url || fallbackImageUrl;
              })
            );
            setRealImages(imageUrls);
          } else {
            setRealImages([fallbackImageUrl]);
          }
        } else {
          setRealImages([fallbackImageUrl]);
        }
      } catch (error) {
        console.error('Error cargando imágenes reales:', error);
        setRealImages([fallbackImageUrl]);
      } finally {
        setLoadingImages(false);
      }
    };

    loadRealImages();
  }, [researchId]);

  // Procesar las selecciones de imágenes
  const imageIndexes = Object.keys(imageSelections).map(Number).sort((a, b) => a - b);
  const currentImageIndex = selectedImageIndex ?? finalSelectedImageIndex ?? 0;

  // Obtener la imagen actual
  const currentImageUrl = realImages[currentImageIndex] || fallbackImageUrl;

  // Generar datos de heatmap para la imagen actual
  const generateHeatmapData = () => {
    const heatmapData: Array<{ x: number; y: number; value: number }> = [];

    if (imageSelections[currentImageIndex.toString()]) {
      const click = imageSelections[currentImageIndex.toString()].click;
      heatmapData.push({
        x: click.x,
        y: click.y,
        value: 1
      });
    }

    return heatmapData;
  };

  return (
    <div className="p-6">
      {/* Información de la pregunta */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
        {description && (
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        )}

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalSelections}</div>
            <div className="text-sm text-blue-600">Selecciones</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalParticipants}</div>
            <div className="text-sm text-green-600">Participantes</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{realImages.length}</div>
            <div className="text-sm text-purple-600">Imágenes</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{selectedHitzone ? 'Sí' : 'No'}</div>
            <div className="text-sm text-orange-600">Hitzone Seleccionado</div>
          </div>
        </div>
      </div>

      {/* Selector de imágenes */}
      {realImages.length > 1 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-800 mb-3">Seleccionar Imagen</h4>
          <div className="flex space-x-2">
            {realImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
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
      )}

      {/* Controles de visualización */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Tipo de Visualización</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHeatmap(true)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${showHeatmap
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span>🔥</span>
            <span>Heat Map</span>
          </button>
          <button
            onClick={() => setShowHeatmap(false)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center space-x-2 ${!showHeatmap
              ? 'bg-blue-500 text-white border-blue-500'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
          >
            <span>📍</span>
            <span>Click Map</span>
          </button>
        </div>
      </div>

      {/* Área de visualización */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          Visualización - Imagen {currentImageIndex + 1}
        </h4>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>📊 Resultados de Navigation Flow:</strong> Mostrando la misma imagen que se usa en la configuración, con los hitzones y clicks reales de los participantes.
          </div>
        </div>
        <div className="relative bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
          {/* Imagen real del backend */}
          <div className="text-center">
            <div
              className="relative w-full max-w-4xl bg-white border border-gray-200 rounded-lg overflow-hidden"
              style={{ aspectRatio: imgNatural ? `${imgNatural.width} / ${imgNatural.height}` : undefined }}
            >
              {/* Badge de demostración */}
              <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded z-20">
                {loadingImages ? 'Cargando...' : 'Imagen Real'}
              </div>

              {loadingImages ? (
                <div className="flex items-center justify-center h-64 bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando imagen real...</p>
                  </div>
                </div>
              ) : (
                <img
                  src={currentImageUrl}
                  alt={`Imagen ${currentImageIndex + 1}`}
                  className="w-full h-auto object-contain bg-white"
                  draggable={false}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
                    setImgNatural({ width: naturalWidth, height: naturalHeight });
                    setImgSize({ width, height });
                  }}
                  style={{ display: 'block' }}
                />
              )}
            </div>

            {/* Hitzone overlay */}
            {imageSelections[currentImageIndex.toString()] && imgSize && imgNatural && (
              <svg
                width={imgSize.width}
                height={imgSize.height}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', width: imgSize.width, height: imgSize.height }}
              >
                {/* Hitzone rectangle */}
                <rect
                  x={imageSelections[currentImageIndex.toString()].click.x * (imgSize.width / imgNatural.width)}
                  y={imageSelections[currentImageIndex.toString()].click.y * (imgSize.height / imgNatural.height)}
                  width={imageSelections[currentImageIndex.toString()].click.hitzoneWidth * (imgSize.width / imgNatural.width)}
                  height={imageSelections[currentImageIndex.toString()].click.hitzoneHeight * (imgSize.height / imgNatural.height)}
                  fill="rgba(0,123,255,0.15)"
                  stroke="#007bff"
                  strokeWidth={2}
                  rx={4}
                />

                {/* Click point */}
                <circle
                  cx={imageSelections[currentImageIndex.toString()].click.x * (imgSize.width / imgNatural.width)}
                  cy={imageSelections[currentImageIndex.toString()].click.y * (imgSize.height / imgNatural.height)}
                  r={6}
                  fill={showHeatmap ? "#ef4444" : "#3b82f6"}
                  stroke={showHeatmap ? "#dc2626" : "#1d4ed8"}
                  strokeWidth={2}
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Información detallada de clicks */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-3">Detalles de Interacción</h4>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h5 className="font-medium text-gray-900">Imagen {currentImageIndex + 1}</h5>
          </div>
          <div className="p-6">
            {imageSelections[currentImageIndex.toString()] ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hitzone ID
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      {imageSelections[currentImageIndex.toString()].hitzoneId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Posición del Click
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      X: {imageSelections[currentImageIndex.toString()].click.x.toFixed(2)},
                      Y: {imageSelections[currentImageIndex.toString()].click.y.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ancho del Hitzone
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      {imageSelections[currentImageIndex.toString()].click.hitzoneWidth.toFixed(2)}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alto del Hitzone
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                      {imageSelections[currentImageIndex.toString()].click.hitzoneHeight.toFixed(2)}px
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos de interacción para esta imagen
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de todas las imágenes */}
      {imageIndexes.length > 1 && (
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-3">Resumen de Todas las Imágenes</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageIndexes.map((index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Imagen {index + 1}</h5>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {imageSelections[index.toString()] ? 'Con datos' : 'Sin datos'}
                  </span>
                </div>
                {imageSelections[index.toString()] ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Hitzone:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">
                        {imageSelections[index.toString()].hitzoneId}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Click:</span>
                      <span className="ml-2 text-gray-900 font-mono text-xs">
                        ({imageSelections[index.toString()].click.x.toFixed(0)},
                        {imageSelections[index.toString()].click.y.toFixed(0)})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Sin interacciones registradas</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
