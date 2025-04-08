import React, { useState, useRef, useEffect } from 'react';
import FileUploader from '@/components/FileUploader';
import { EyeTrackingFormData, EyeTrackingStimulus } from 'shared/interfaces/eye-tracking.interface';
import { useErrorLog } from '@/components/utils/ErrorLogger';

interface StimuliTabProps {
  formData: EyeTrackingFormData;
  researchId: string;
  removeStimulus: (id: string) => void;
  handleFileUploaderComplete: (fileData: { fileUrl: string; key: string }) => void;
}

export const StimuliTab: React.FC<StimuliTabProps> = ({ 
  formData, 
  researchId, 
  removeStimulus,
  handleFileUploaderComplete
}) => {
  const [uploadResult, setUploadResult] = useState<{ fileUrl: string; key: string } | null>(null);
  const logger = useErrorLog();
  
  // Usar una ref para comparar cambios sin crear bucles de actualización
  const prevStimuliCountRef = useRef<number>(0);
  
  // Añadir esta referencia al inicio del componente, después de las otras constantes
  const recoveredItemsRef = useRef<boolean>(false);
  
  // Usar useEffect para monitorear cambios de forma segura
  useEffect(() => {
    // Solo registramos cuando hay un cambio real
    if (formData.stimuli?.items?.length !== prevStimuliCountRef.current) {
      logger.debug('StimuliTab - Cambio en número de estímulos:', {
        prevCount: prevStimuliCountRef.current,
        newCount: formData.stimuli?.items?.length || 0
      });
      prevStimuliCountRef.current = formData.stimuli?.items?.length || 0;
    }
  }, [formData.stimuli?.items?.length, logger]);

  // Reemplazar completamente el useEffect que recupera archivos de localStorage
  useEffect(() => {
    // Si ya recuperamos items anteriormente, no hacemos nada
    if (recoveredItemsRef.current) return;
    
    try {
      if (!researchId) return;
      
      // Debemos comprobar la clave de localStorage para archivos ya subidos
      const stimuliTabStorageKey = `eye_tracking_fileuploader_${researchId}`;
      
      // Primero intentamos con la clave del StimuliTab (archivos ya subidos a S3)
      const savedItemsJson = localStorage.getItem(stimuliTabStorageKey);
      
      logger.debug('StimuliTab - Verificando localStorage (una sola vez): ', {
        stimuliTabStorageKey,
        hasStimuli: !!savedItemsJson
      });
      
      if (savedItemsJson) {
        const savedItems = JSON.parse(savedItemsJson);
        logger.debug('StimuliTab - Archivos pendientes encontrados:', {
          count: savedItems.length
        });
        
        if (savedItems.length > 0) {
          // Para cada ítem guardado, verificar si ya existe en los estímulos actuales
          const itemsToRecover: Array<{fileUrl: string; key: string; fileName?: string; fileType?: string}> = [];
          
          for (const item of savedItems) {
            // Verificar si este ítem ya está en los estímulos actuales
            const alreadyExists = formData.stimuli.items.some(
              stimulus => stimulus.s3Key === item.key
            );
            
            if (!alreadyExists) {
              // Acumulamos los items a recuperar en vez de llamar al callback inmediatamente
              itemsToRecover.push(item);
            }
          }
          
          // Si tenemos items para recuperar, los procesamos uno por uno con un retraso
          if (itemsToRecover.length > 0) {
            logger.debug('StimuliTab - Recuperando items pendientes:', {
              count: itemsToRecover.length
            });
            
            // Procesar con retraso para evitar bucles infinitos
            setTimeout(() => {
              itemsToRecover.forEach((item, index) => {
                // Procesar cada item con un pequeño retraso incremental
                setTimeout(() => {
                  handleFileUploaderComplete({
                    fileUrl: item.fileUrl,
                    key: item.key
                  });
                }, index * 100); // 100ms de retraso entre items
              });
            }, 500); // 500ms de retraso inicial
          }
        }
        
        // Limpiar datos de localStorage para evitar reprocesamiento
        localStorage.removeItem(stimuliTabStorageKey);
        logger.debug('StimuliTab - Limpiada clave de localStorage', {
          key: stimuliTabStorageKey
        });
      }
    } catch (error) {
      logger.error('StimuliTab - Error al recuperar archivos pendientes:', error);
    } finally {
      // Marcar como recuperado en todos los casos para evitar bucles
      recoveredItemsRef.current = true;
    }
  // Este efecto solo depende de researchId y handleFileUploaderComplete - NO incluimos formData
  }, [researchId, logger, handleFileUploaderComplete]);
  
  // Handle file upload completion - Mejorado para garantizar la persistencia
  const handleUploadComplete = (fileData: { fileUrl: string; key: string }) => {
    logger.debug('StimuliTab - handleUploadComplete recibido:', fileData);
    
    // Guardar el resultado de la última subida
    setUploadResult({
      fileUrl: fileData.fileUrl,
      key: fileData.key
    });
    
    // Persistir en localStorage para recuperar si se navega a otra vista - MEJORADO
    try {
      // Usar clave más específica
      const storageKey = `eye_tracking_fileuploader_${researchId}`;
      
      // Extraer información del nombre del archivo desde la clave
      const fileName = fileData.key.split('/').pop() || 'archivo.jpg';
      const fileType = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Crear un nuevo ítem con la información necesaria para recrear el estímulo
      const newItem = {
        fileUrl: fileData.fileUrl,
        key: fileData.key,
        fileName,
        fileType,
        timestamp: new Date().toISOString()
      };
      
      // Guardar directamente, sin combinar con datos existentes para evitar duplicados
      localStorage.setItem(storageKey, JSON.stringify([newItem]));
      
      logger.debug('StimuliTab - Guardado en localStorage:', {
        storageKey,
        item: newItem
      });
    } catch (error) {
      logger.error('StimuliTab - Error al guardar en localStorage:', error);
    }
    
    // Pasar el resultado al manejador principal
    logger.debug('StimuliTab - Llamando a handleFileUploaderComplete con:', fileData);
    handleFileUploaderComplete(fileData);
  };

  // Manejar error en la subida
  const handleUploadError = (error: any) => {
    logger.error('StimuliTab - Error al cargar archivo:', error);
    alert(`Error al subir el archivo: ${error.message || 'Error desconocido'}`);
  };

  // Limpiar localStorage solo cuando se guarda completamente el formulario
  // Esto requiere agregar una prop a StimuliTabProps y pasarla desde el componente padre
  useEffect(() => {
    // Verificar si formData ya tiene al menos un ítem y ese ítem tiene s3Key
    // Esto indica que se completó una carga correctamente
    const hasCompletedUploads = formData.stimuli.items.some(item => item.s3Key);
    
    if (hasCompletedUploads && formData.stimuli.items.length > 0) {
      // Limpiamos localStorage solo si se confirma que tenemos ítems guardados correctamente
      try {
        const storageKey = `eye_tracking_fileuploader_${researchId}`;
        localStorage.removeItem(storageKey);
        logger.debug('StimuliTab - Archivos guardados correctamente, limpiando localStorage', {
          itemCount: formData.stimuli.items.length
        });
      } catch (error) {
        logger.error('StimuliTab - Error al limpiar localStorage:', error);
      }
    }
  }, [formData.stimuli.items, researchId, logger]);

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-900">Estímulos</h3>
              <p className="text-xs text-neutral-500">
                Sube las imágenes que serán utilizadas como estímulos en el experimento de eye tracking.
              </p>
              
              {/* Debug info */}
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                <p className="font-medium text-yellow-800">Información de depuración:</p>
                <p className="text-yellow-700">Número actual de estímulos: {formData.stimuli.items.length}</p>
              </div>
              
              <div className="mt-4 space-y-4">
                <FileUploader 
                  researchId={researchId}
                  folder="eye-tracking-stimuli"
                  accept="image/*"
                  multiple={true}
                  maxSize={10 * 1024 * 1024} // 10MB
                  onUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                />

                {/* Uploaded files section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Estímulos seleccionados:</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {formData.stimuli.items.map((stimulus: EyeTrackingStimulus & { isLoading?: boolean; progress?: number }) => (
                      <div key={stimulus.id} className="border rounded-lg p-3 bg-neutral-50">
                        <div className="aspect-video bg-neutral-200 rounded-md mb-2 overflow-hidden relative">
                          {stimulus.fileUrl && (
                            <>
                              <img 
                                src={stimulus.fileUrl} 
                                alt={stimulus.fileName}
                                className="h-full w-full object-cover"
                              />
                              {stimulus.isLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30">
                                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                  {stimulus.progress !== undefined && (
                                    <div className="text-white text-xs mt-2 font-medium">{Math.round(stimulus.progress)}%</div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                          {!stimulus.fileUrl && (
                            <div className="h-full w-full flex items-center justify-center text-neutral-400">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs font-medium truncate" title={stimulus.fileName}>
                              {stimulus.fileName}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {Math.round((stimulus.fileSize || 0) / 1024)} KB
                            </div>
                            {stimulus.s3Key && !stimulus.isLoading && (
                              <div className="text-xs text-green-600">
                                ✓ Subido a S3
                              </div>
                            )}
                            {stimulus.isLoading && (
                              <div className="text-xs text-blue-600">
                                Cargando...
                              </div>
                            )}
                            {stimulus.error && (
                              <div className="text-xs text-red-600" title={stimulus.errorMessage || ''}>
                                ⚠️ Error al cargar
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeStimulus(stimulus.id)}
                            className="p-1 text-red-500 hover:text-red-700"
                            title="Eliminar estímulo"
                            disabled={stimulus.isLoading}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Barra de progreso */}
                        {stimulus.isLoading && stimulus.progress !== undefined && (
                          <div className="mt-2">
                            <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-200"
                                style={{ width: `${stimulus.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {formData.stimuli.items.length === 0 && (
                      <div className="col-span-3 p-4 bg-neutral-50 rounded-lg text-center text-neutral-500">
                        No hay estímulos subidos aún. Usa el cargador para subir imágenes.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mostrar detalles del último archivo subido */}
      {uploadResult && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-blue-800">Último archivo subido:</h4>
          <div className="mt-2 text-xs text-blue-700 break-all">
            <p><strong>URL:</strong> {uploadResult.fileUrl}</p>
            <p><strong>Clave S3:</strong> {uploadResult.key}</p>
          </div>
        </div>
      )}
    </>
  );
}; 