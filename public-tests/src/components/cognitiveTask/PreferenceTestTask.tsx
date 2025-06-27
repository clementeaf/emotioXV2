import React, { useState } from 'react';
import { MappedStepComponentProps } from '../../types/flow.types';

interface PreferenceFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface PreferenceTestConfig {
  id: string;
  type: string;
  title?: string;
  description?: string;
  required?: boolean;
  files?: PreferenceFile[];
}

const PreferenceTestTask: React.FC<MappedStepComponentProps> = ({ stepConfig, onStepComplete, savedResponse }) => {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenSaved, setHasBeenSaved] = useState<boolean>(false);

  // Extraer la configuración de la pregunta - MEJORADO para compatibilidad
  let preferenceQuestion: any = null;

  if (stepConfig && typeof stepConfig === 'object') {
    // Caso 1: stepConfig es un array de preguntas (formato anterior)
    if ('questions' in stepConfig && Array.isArray((stepConfig as any).questions)) {
      const config = stepConfig as { questions: any[] };
      preferenceQuestion = config.questions.find(q => q.type === 'preference_test');
    }
    // Caso 2: stepConfig es directamente la pregunta (formato actual del log)
    else if ('type' in stepConfig && (stepConfig as any).type === 'preference_test') {
      preferenceQuestion = stepConfig;
    }
    // Caso 3: stepConfig tiene estructura anidada con config
    else if ('config' in stepConfig) {
      preferenceQuestion = (stepConfig as any).config;
    }
  }

  // Extraer datos con fallbacks
  const config = preferenceQuestion || stepConfig;
  const images = config?.files || [];

  // 🔍 LOGGING CRÍTICO PARA DEBUG
  console.log('[PreferenceTestTask] 🔍 DEBUG COMPLETO:', {
    stepConfig,
    preferenceQuestion,
    config,
    images,
    imagesLength: images.length,
    savedResponse,
    savedResponseType: typeof savedResponse,
    savedResponseKeys: savedResponse && typeof savedResponse === 'object' ? Object.keys(savedResponse) : null,
    fullSavedResponse: JSON.stringify(savedResponse, null, 2)
  });

  // Cargar respuesta previa si existe - LÓGICA MEJORADA
  React.useEffect(() => {
    console.log('[PreferenceTestTask] useEffect savedResponse:', savedResponse);

    if (savedResponse) {
      let extractedImageId: string | null = null;

      // Caso 1: savedResponse tiene selectedImageId directamente
      if (typeof savedResponse === 'object' && 'selectedImageId' in savedResponse) {
        extractedImageId = (savedResponse as { selectedImageId: string }).selectedImageId;
        console.log('[PreferenceTestTask] Caso 1 - selectedImageId directo:', extractedImageId);
      }
      // Caso 2: savedResponse tiene structure { response: { selectedImageId: ... } }
      else if (typeof savedResponse === 'object' && 'response' in savedResponse) {
        const response = (savedResponse as { response: unknown }).response;
        if (typeof response === 'object' && response && 'selectedImageId' in response) {
          extractedImageId = (response as { selectedImageId: string }).selectedImageId;
          console.log('[PreferenceTestTask] Caso 2 - response.selectedImageId:', extractedImageId);
        }
      }
      // Caso 3: savedResponse es directamente el selectedImageId como string
      else if (typeof savedResponse === 'string') {
        extractedImageId = savedResponse;
        console.log('[PreferenceTestTask] Caso 3 - string directo:', extractedImageId);
      }
      // Caso 4: cualquier estructura que contenga el valor
      else if (typeof savedResponse === 'object') {
        // Buscar recursivamente cualquier propiedad que contenga un ID de imagen válido
        const searchForImageId = (obj: any): string | null => {
          if (!obj || typeof obj !== 'object') return null;

          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && images.some((img: any) => img.id === value)) {
              console.log('[PreferenceTestTask] Caso 4 - encontrado en:', key, value);
              return value;
            }
            if (typeof value === 'object' && value !== null) {
              const nested = searchForImageId(value);
              if (nested) return nested;
            }
          }
          return null;
        };

        extractedImageId = searchForImageId(savedResponse);
      }

      if (extractedImageId && images.some((img: any) => img.id === extractedImageId)) {
        console.log('[PreferenceTestTask] ✅ Cargando respuesta previa:', extractedImageId);
        setSelectedImageId(extractedImageId);
        setHasBeenSaved(true);
      } else {
        console.log('[PreferenceTestTask] ❌ No se pudo extraer imageId válido:', extractedImageId);
      }
    }
  }, [savedResponse, images]);

  console.log('[PreferenceTestTask] stepConfig:', stepConfig);
  console.log('[PreferenceTestTask] images:', images);

  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);
    setError(null);
  };

  const handleContinue = () => {
    if (!selectedImageId) {
      setError('Por favor, selecciona una opción antes de continuar');
      return;
    }

    const selectedImage = images.find((img: any) => img.id === selectedImageId);
    const responseData = {
      questionId: config.id,
      selectedImageId,
      selectedImageName: selectedImage?.name,
      type: 'preference_test'
    };

    console.log('[PreferenceTestTask] Respuesta enviada:', responseData);
    setHasBeenSaved(true);
    onStepComplete?.(responseData);
  };

  if (!images || images.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-lg text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Configuración</h2>
          <p className="text-gray-600">No se encontraron imágenes para esta pregunta de preferencia.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {config?.title || 'Pregunta de Preferencia'}
          </h1>
          {config?.description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {config.description}
            </p>
          )}

        </div>

        {/* Images Grid */}
        <div className="flex flex-row gap-4">
          {images.map((image: any, index: number) => (
            <div
              key={image.id}
              className={`relative rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedImageId === image.id
                  ? 'ring-4 ring-blue-500 shadow-2xl scale-[1.02]'
                  : 'hover:shadow-xl'
              }`}
              onClick={() => handleImageSelect(image.id)}
            >
              {/* Selection indicator */}
              {selectedImageId === image.id && (
                <div className="absolute top-4 right-4 z-10 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg">
                  ✓
                </div>
              )}

              {/* Option label */}
              <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                Opción {index + 1}
              </div>

              {/* Image */}
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={image.url}
                  alt={image.name || `Opción ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Image info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-800 truncate">
                  {image.name || `Imagen ${index + 1}`}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-center mb-6">
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg py-2 px-4 inline-block">
              {error}
            </p>
          </div>
        )}

        {/* Continue button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {hasBeenSaved ? 'Actualizar y continuar' : 'Guardar y continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreferenceTestTask;
