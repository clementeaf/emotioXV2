import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Question, UploadedFile } from 'shared/interfaces/cognitive-task.interface';
import { CognitiveTaskFormData } from './useCognitiveTaskForm';
import { FileInfo } from '../types';
import { useAuth } from '@/providers/AuthProvider';

// Helper para asegurar que un objeto es FileInfo
const asFileInfo = (file: any): FileInfo => ({
  id: file.id || uuidv4(),
  name: file.name || '',
  size: file.size || 0,
  type: file.type || '',
  url: file.url || '',
  s3Key: file.s3Key,
  status: file.status || 'uploaded',
  progress: file.progress,
  error: file.error,
  isLoading: file.isLoading,
  questionId: file.questionId
});

interface UseCognitiveTaskFileUploadProps {
  researchId?: string;
  formData: CognitiveTaskFormData;
  setFormData: Dispatch<SetStateAction<CognitiveTaskFormData>>;
}

interface UseCognitiveTaskFileUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>;
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;
  loadFilesFromLocalStorage: () => Record<string, FileInfo[]> | null; // Usar FileInfo
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'; // Ajustar según sea necesario

// Función para normalizar nombres de archivo
function normalizeFileName(name: string): string {
  return name
    .normalize('NFD').replace(/[^\w.\-]+/g, '_') // Solo letras, números, guion, guion bajo y punto
    .replace(/_+/g, '_') // Reemplaza múltiples guiones bajos por uno solo
    .replace(/\.+/g, '.') // Solo un punto para la extensión
    .toLowerCase();
}

export const useCognitiveTaskFileUpload = ({
  researchId,
  formData,
  setFormData,
}: UseCognitiveTaskFileUploadProps): UseCognitiveTaskFileUploadResult => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const { token } = useAuth();

  // --- Lógica de LocalStorage --- 
  const saveFilesToLocalStorage = useCallback((questions: Question[]) => {
    if (!researchId) return;
    try {
      const filesMap: Record<string, FileInfo[]> = {};
      questions.forEach(question => {
        if (question.files && question.files.length > 0) {
          // Filtrar archivos con status 'error'
          const validFiles: FileInfo[] = question.files.map(asFileInfo).filter(f => f.status !== 'error');
          if (validFiles.length > 0) {
            filesMap[question.id] = validFiles;
          }
        }
      });
      if (Object.keys(filesMap).length > 0) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        localStorage.setItem(storageKey, JSON.stringify(filesMap));
        console.log('[FileUploadHook] Archivos guardados en localStorage');
      }
    } catch (error) {
      console.error('[FileUploadHook] Error guardando en localStorage:', error);
    }
  }, [researchId]);

  const loadFilesFromLocalStorage = useCallback((): Record<string, FileInfo[]> | null => {
    if (!researchId) return null;
    try {
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      if (!savedFilesJson) return null;
      const savedFiles = JSON.parse(savedFilesJson) as Record<string, any[]>;
      console.log('[FileUploadHook] Archivos recuperados de localStorage para devolver:', savedFiles);
      const filesMapResult: Record<string, FileInfo[]> = {};
      Object.keys(savedFiles).forEach(questionId => {
        // Filtrar archivos con status 'error' al cargar
        filesMapResult[questionId] = savedFiles[questionId].map(asFileInfo).filter(f => f.status !== 'error');
      });
      return filesMapResult;
    } catch (error) {
      console.error('[FileUploadHook] Error recuperando de localStorage:', error);
      return null;
    }
  }, [researchId]);

  // --- Lógica de Carga/Eliminación de Archivos --- 

  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
      console.log(`[FileUploadHook] Iniciando handleFileUpload para ${questionId} con ${files.length} archivo(s).`);
      
      if (!researchId || files.length === 0 || !token) {
          console.warn(`[FileUploadHook ${questionId}] Subida abortada: Faltan researchId, archivos o token.`);
          toast.error('No se pudo iniciar la subida. Falta información necesaria o autenticación.');
          return;
      }

      // Limpiar archivos en estado de error, uploads incompletos o duplicados antes de iniciar
      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
          const updatedQuestions = prevData.questions.map(q => {
              if (q.id === questionId && q.files && q.files.length > 0) {
                  // Primer paso: Filtrar archivos en estado de error o uploads incompletos
                  let cleanedFiles = q.files.filter(f => {
                      const fileInfo = asFileInfo(f);
                      return fileInfo.status !== 'error' && 
                            !(fileInfo.status === 'uploading' && fileInfo.isLoading);
                  });
                  
                  // Segundo paso: Eliminar duplicados (mismo nombre y tamaño)
                  const uniqueFileMap = new Map<string, any>();
                  cleanedFiles.forEach(f => {
                      const fileInfo = asFileInfo(f);
                      // Solo conservar archivos con estado 'uploaded' (no los pendientes de eliminación)
                      if (fileInfo.status === 'uploaded') {
                          const key = `${fileInfo.name}_${fileInfo.size}`;
                          // Si no existe o el actual tiene URL válida, lo mantenemos
                          if (!uniqueFileMap.has(key) || 
                              (!uniqueFileMap.get(key).url && fileInfo.url)) {
                              uniqueFileMap.set(key, f);
                          }
                      } else {
                          // Mantener archivos que están pendientes de eliminación
                          uniqueFileMap.set(fileInfo.id, f);
                      }
                  });
                  
                  return { ...q, files: Array.from(uniqueFileMap.values()) };
              }
              return q;
          });
          return { ...prevData, questions: updatedQuestions };
      });

      const filesToUploadInput = Array.from(files);
      const initialFileCount = filesToUploadInput.length;

      // <<< FILTRAR archivos duplicados ANTES de procesar >>>
      let currentFilesForQuestion: FileInfo[] = [];
      const questionIndex = formData.questions.findIndex(q => q.id === questionId);
      if (questionIndex !== -1 && formData.questions[questionIndex].files) {
          currentFilesForQuestion = formData.questions[questionIndex].files
              .map(asFileInfo)
              .filter(f => f.status !== 'pending-delete' && f.status !== 'error');
          console.log(`[FileUploadHook ${questionId}] Archivos existentes (no pendientes de eliminación ni error) para comprobación:`, 
              currentFilesForQuestion.map(f => ({ name: f.name, size: f.size, status: f.status }))
          );
      } else {
          console.log(`[FileUploadHook ${questionId}] No hay archivos existentes para esta pregunta.`);
      }

      console.log(`[FileUploadHook ${questionId}] Archivos nuevos para comprobar:`, 
          filesToUploadInput.map(f => ({ name: f.name, size: f.size }))
      );

      const filesToProcess = filesToUploadInput.filter(newFile => {
          const isDuplicate = currentFilesForQuestion.some(existingFile => {
              const nameMatch = existingFile.name === newFile.name;
              const sizeMatch = existingFile.size === newFile.size;
              // Considerar duplicado si coincide nombre y tamaño
              return nameMatch && sizeMatch;
          });
          if (isDuplicate) {
              console.log(`[FileUploadHook ${questionId}] Archivo duplicado detectado y omitido: ${newFile.name} (Size: ${newFile.size})`);
          }
          return !isDuplicate;
      });
      const processedFileCount = filesToProcess.length;
      const skippedFileCount = initialFileCount - processedFileCount;

      if (skippedFileCount > 0) {
          toast(`${skippedFileCount} archivo(s) omitido(s) por ser duplicado(s).`);
          console.log(`[FileUploadHook ${questionId}] ${skippedFileCount} de ${initialFileCount} archivos fueron omitidos por duplicación.`);
      }

      if (processedFileCount === 0) {
          console.log(`[FileUploadHook ${questionId}] No hay archivos nuevos para procesar después del filtrado.`);
          // Solo retornar si había archivos inicialmente pero ninguno quedó para procesar
          if (initialFileCount > 0) { 
            return; // Salir si no hay archivos nuevos para procesar
          }
      }
      // <<< FIN FILTRADO >>>

      // <<< USAR filesToProcess en lugar de filesToUpload >>>
      setIsUploading(true);
      setTotalFiles(filesToProcess.length); // <-- Usar longitud filtrada
      setCurrentFileIndex(0);
      setUploadProgress(0);

      // Crear archivos temporales para UI (solo para los filtrados)
      const tempFilesMap = new Map<string, FileInfo>();
      filesToProcess.forEach(file => { // <-- Usar array filtrado
        const tempFile: FileInfo = {
            id: `${questionId}_${uuidv4()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file), // URL local para preview
            s3Key: '',
            status: 'uploading',
            progress: 0,
            isLoading: true,
            questionId: questionId
        };
        tempFilesMap.set(tempFile.id, tempFile);
      });
      const tempFilesArray = Array.from(tempFilesMap.values());

      // Añadir archivos temporales al estado
      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
          const updatedQuestions = [...prevData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
          if (questionIndex === -1) return prevData;
          const existingFiles = (updatedQuestions[questionIndex].files || []).map(asFileInfo);
          updatedQuestions[questionIndex].files = [...existingFiles, ...tempFilesArray];
          console.log(`[FileUploadHook ${questionId}] Estado actualizado con ${tempFilesArray.length} archivos temporales.`);
          return { ...prevData, questions: updatedQuestions };
      });

      // Procesar cada archivo (filtrado)
      let successfulUploads = 0;
      for (let i = 0; i < filesToProcess.length; i++) { // <-- Usar array filtrado
          const file = filesToProcess[i]; // <-- Usar array filtrado
          const tempFileId = tempFilesArray[i].id;
          // Normalizar el nombre del archivo antes de subir
          const normalizedFileName = normalizeFileName(file.name);
          // Crear un nuevo objeto File con el nombre normalizado
          const fileToUpload = new File([file], normalizedFileName, { type: file.type });
          console.log(`[FileUploadHook ${questionId}] Procesando archivo ${i + 1}/${filesToProcess.length}: ${file.name} (TempID: ${tempFileId})`);
          setCurrentFileIndex(i + 1);

          let finalUploadedFile: UploadedFile | null = null; // Para guardar los datos del archivo final
          let uploadError = false;

          try {
              // 1. Obtener URL prefirmada de subida del backend
              // Usar la variable de entorno correcta que apunta a la URL de AWS
              const backendUrl = process.env.NEXT_PUBLIC_API_URL;
              if (!backendUrl) {
                  console.error("[FileUploadHook] Error: NEXT_PUBLIC_API_URL no está definida en las variables de entorno.");
                  throw new Error("La URL del backend no está configurada.");
              }
              const getUploadUrlEndpoint = `${backendUrl}/research/${researchId}/cognitive-task/upload-url`; 
              console.log(`[FileUploadHook ${questionId}] Llamando a API: POST ${getUploadUrlEndpoint}`);
              const apiResponse = await fetch(getUploadUrlEndpoint, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                      fileName: normalizedFileName,
                      fileSize: file.size,
                      fileType: file.type,
                      questionId: questionId
                  })
              });

              if (!apiResponse.ok) {
                  const errorBody = await apiResponse.text();
                  console.error(`[FileUploadHook ${questionId}] Error ${apiResponse.status} obteniendo URL de subida:`, errorBody);
                  throw new Error(`Error del servidor (${apiResponse.status}) al obtener URL de subida.`);
              }

              const result = await apiResponse.json();
              if (!result || !result.uploadUrl || !result.file || !result.file.s3Key) {
                  console.error(`[FileUploadHook ${questionId}] Respuesta inválida obteniendo URL de subida:`, result);
                  throw new Error('Respuesta inválida del servidor al obtener URL de subida.');
              }
              
              const { uploadUrl, file: backendFileInfo } = result;
              finalUploadedFile = backendFileInfo; // Guardar datos finales
              console.log(`[FileUploadHook ${questionId}] URL de subida obtenida para ${file.name}. S3 Key: ${finalUploadedFile?.s3Key}`);

              // 2. Subir el archivo a S3 usando la URL prefirmada
              console.log(`[FileUploadHook ${questionId}] Subiendo a S3: PUT ${uploadUrl.substring(0, 100)}...`);
              const s3Response = await fetch(uploadUrl, {
                  method: 'PUT',
                  headers: {
                      'Content-Type': fileToUpload.type
                  },
                  body: fileToUpload
              });

              if (!s3Response.ok) {
                  const s3ErrorBody = await s3Response.text();
                  console.error(`[FileUploadHook ${questionId}] Error ${s3Response.status} subiendo a S3:`, s3ErrorBody);
                  throw new Error(`Error del servidor (${s3Response.status}) al subir archivo a S3.`);
              }

              console.log(`[FileUploadHook ${questionId}] Archivo ${file.name} subido exitosamente a S3.`);
              successfulUploads++;

          } catch (error: any) { // Capturar error de CUALQUIERA de los pasos (API o S3)
              console.error(`[FileUploadHook ${questionId}] Error procesando archivo ${file.name}:`, error);
              toast.error(`Error subiendo ${file.name}: ${error.message || 'Error desconocido'}`);
              uploadError = true;
              // Marcar el archivo temporal como erróneo en el estado
              setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
                  const updatedQuestions = prevData.questions.map(q => {
                      if (q.id === questionId && q.files) {
                          const filesAsInfo: FileInfo[] = q.files.map(asFileInfo);
                          const updatedFiles = filesAsInfo.map(f => 
                              f.id === tempFileId ? { ...f, status: 'error' as const, isLoading: false, progress: 0 } : f
                          );
                          return { ...q, files: updatedFiles };
                      }
                      return q;
                  });
                  return { ...prevData, questions: updatedQuestions };
              });
          }

          // 3. Actualizar estado final para este archivo (si no hubo error)
          if (!uploadError && finalUploadedFile) {
                const finalFileState: FileInfo = {
                    ...asFileInfo(finalUploadedFile), // Usar datos del backend (s3Key, etc.)
                    id: tempFileId, // <<< ¡¡IMPORTANTE: Usar el ID TEMPORAL para reemplazar correctamente!!
                    url: finalUploadedFile.url, // <<< CORREGIDO
                    status: 'uploaded',
                    isLoading: false,
                    progress: 100,
                    questionId: questionId
                };

                setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
                    console.log(`[FileUploadHook ${questionId}] Actualizando estado para TempID: ${tempFileId}. Datos finales entrantes:`, JSON.stringify(finalFileState));
                    console.log(`[FileUploadHook ${questionId}] Estado ANTES de reemplazar TempID ${tempFileId}:`, JSON.stringify(prevData.questions.find(q => q.id === questionId)?.files?.map(f => ({id: f.id, name: f.name, status: f.status})) || 'Pregunta no encontrada o sin archivos'));
                    const updatedQuestions = [...prevData.questions];
                    const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
                    if (questionIndex !== -1 && updatedQuestions[questionIndex].files) {
                        // Ensure the array contains FileInfo objects before searching
                        let currentFiles = updatedQuestions[questionIndex].files.map(asFileInfo);
                        // Eliminar archivos temporales duplicados (mismo nombre y tamaño, estado uploading)
                        currentFiles = currentFiles.filter(f => {
                          if (f.id === tempFileId) return true;
                          if (f.name === finalFileState.name && f.size === finalFileState.size && f.status === 'uploading') {
                            return false; // Eliminar duplicado temporal
                          }
                          return true;
                        });
                        // Find the index of the temporary file to replace using its ID
                        const fileIndexToReplace = currentFiles.findIndex(f => f.id === tempFileId);
                        if (fileIndexToReplace !== -1) {
                            // Create a new array with the replaced item using slice
                            const updatedFiles = [
                                ...currentFiles.slice(0, fileIndexToReplace),
                                finalFileState, // Replace with the final state object
                                ...currentFiles.slice(fileIndexToReplace + 1),
                            ];
                            updatedQuestions[questionIndex].files = updatedFiles;
                            saveFilesToLocalStorage(updatedQuestions); 
                            console.log(`[FileUploadHook ${questionId}] Archivo ${file.name} (TempID: ${tempFileId}) REEMPLAZADO en índice ${fileIndexToReplace}.`);
                            console.log(`[FileUploadHook ${questionId}] Estado DESPUÉS de reemplazar TempID ${tempFileId}:`, JSON.stringify(updatedFiles.map(f => ({id: f.id, name: f.name, status: f.status}))));
                        } else {
                             console.warn(`[FileUploadHook ${questionId}] No se encontró el índice para TempID ${tempFileId} para reemplazar. Estado actual de archivos:`, JSON.stringify(currentFiles.map(f => ({id: f.id, name: f.name, status: f.status}))));
                             // Verificar si el archivo ya existe por nombre y tamaño para evitar duplicaciones
                             const existingFileIndex = currentFiles.findIndex(f => 
                                 f.name === finalFileState.name && 
                                 f.size === finalFileState.size && 
                                 f.status === 'uploaded'
                             );
                             if (existingFileIndex === -1) {
                                 // Solo si no existe un archivo idéntico, agregamos el nuevo
                                 console.log(`[FileUploadHook ${questionId}] No se encontró archivo existente similar, agregando nuevo.`);
                                 updatedQuestions[questionIndex].files = [...currentFiles, finalFileState];
                             } else {
                                 console.log(`[FileUploadHook ${questionId}] Se encontró archivo existente similar, evitando duplicación.`);
                             }
                        }
                    }
                    return { ...prevData, questions: updatedQuestions };
                });
          }
          // Actualizar progreso general (incluso si hubo error en este archivo)
          setUploadProgress(((i + 1) / filesToProcess.length) * 100); 

      } // Fin del bucle for

      console.log(`[FileUploadHook ${questionId}] Bucle de subida finalizado. ${successfulUploads}/${filesToProcess.length} archivos exitosos.`);
      setIsUploading(false);
      
      // Eliminación final de duplicados después de completar todas las subidas
      if (successfulUploads > 0) {
          setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
              const updatedQuestions = prevData.questions.map(q => {
                  if (q.id === questionId && q.files && q.files.length > 0) {
                      // Crear un mapa para detectar y eliminar duplicados
                      const uniqueFileMap = new Map<string, FileInfo>();
                      
                      // Ordenar para procesar primero los archivos completados
                      const filesAsInfo = q.files.map(asFileInfo)
                          .sort((a, b) => {
                              // Priorizar archivos completados
                              if (a.status === 'uploaded' && b.status !== 'uploaded') return -1;
                              if (a.status !== 'uploaded' && b.status === 'uploaded') return 1;
                              return 0;
                          });
                      
                      // Eliminar duplicados preservando los completados
                      filesAsInfo.forEach(file => {
                          if (file.status === 'uploaded') {
                              const key = `${file.name}_${file.size}`;
                              // Solo guardar si no existe ya o si el existente no tiene URL
                              if (!uniqueFileMap.has(key) || !uniqueFileMap.get(key)?.url) {
                                  uniqueFileMap.set(key, file);
                              }
                          } else if (file.status === 'pending-delete') {
                              // Mantener los marcados para eliminación
                              uniqueFileMap.set(file.id, file);
                          } else if (file.status === 'error') {
                              // No incluir archivos con error
                          } else {
                              // Para otros estados (como 'uploading'), revisar si hay versión completada
                              const key = `${file.name}_${file.size}`;
                              if (!uniqueFileMap.has(key)) {
                                  uniqueFileMap.set(file.id, file);
                              }
                          }
                      });
                      
                      return { ...q, files: Array.from(uniqueFileMap.values()) };
                  }
                  return q;
              });
              
              // Guardar estado limpio en localStorage
              saveFilesToLocalStorage(updatedQuestions);
              return { ...prevData, questions: updatedQuestions };
          });
      }
      
      if (successfulUploads === filesToProcess.length) {
         // toast.success(`${successfulUploads} archivo(s) subido(s) exitosamente.`); // Quizás no mostrar si todo ok?
      } else if (successfulUploads > 0) {
         // Usar toast normal con icono de advertencia
         toast(`${successfulUploads}/${filesToProcess.length} archivos subidos. Algunos fallaron. ⚠️`);
      } else {
         // El toast de error ya se mostró dentro del bucle
      }

  }, [researchId, token, formData.questions, setFormData, saveFilesToLocalStorage]);

  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
      await handleFileUpload(questionId, files);
  }, [handleFileUpload]);

  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
      console.log(`[FileUploadHook] Solicitud para eliminar archivo ${fileId} en pregunta ${questionId}`);
      // Encontrar el archivo en el estado actual
      let fileToDelete: FileInfo | undefined;
      const currentQuestion = formData.questions.find(q => q.id === questionId);
      if (currentQuestion?.files) {
          fileToDelete = currentQuestion.files.map(asFileInfo).find(f => f.id === fileId);
      }
      if (!fileToDelete) {
          console.warn(`[FileUploadHook] No se encontró el archivo con ID ${fileId} para eliminar.`);
          toast.error('No se pudo encontrar el archivo a eliminar.');
          return;
      }
      // Revocar URL local si es blob
      if (fileToDelete.url?.startsWith('blob:')) {
          URL.revokeObjectURL(fileToDelete.url);
      }
      // Eliminar el archivo del estado local inmediatamente
      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
          const updatedQuestions = prevData.questions.map(q => {
              if (q.id === questionId && q.files) {
                  // Filtrar solo el archivo cuyo id coincide exactamente con fileId
                  const updatedFiles = q.files.filter(f => f.id !== fileId);
                  return { ...q, files: updatedFiles };
              }
              return q;
          });
          saveFilesToLocalStorage(updatedQuestions); // Guardar estado sin el archivo eliminado
          return { ...prevData, questions: updatedQuestions };
      });
      toast.success(`Archivo ${fileToDelete.name} eliminado de la UI. Se eliminará definitivamente al guardar.`);

      // --- LIMPIEZA DE LOCALSTORAGE SOLO AL ELIMINAR DEFINITIVAMENTE ---
      // Esta parte debe llamarse después de la eliminación real en S3 (no aquí, sino en el flujo de guardado principal)
  }, [formData.questions, setFormData, saveFilesToLocalStorage]);

  return {
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete,
    loadFilesFromLocalStorage,
  };
}; 