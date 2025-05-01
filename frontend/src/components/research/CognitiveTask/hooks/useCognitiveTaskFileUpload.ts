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
          const validFiles: FileInfo[] = question.files.map(asFileInfo);
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
        filesMapResult[questionId] = savedFiles[questionId].map(asFileInfo);
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

      const filesToUpload = Array.from(files);
      setIsUploading(true);
      setTotalFiles(filesToUpload.length);
      setCurrentFileIndex(0);
      setUploadProgress(0);

      // Crear archivos temporales para UI
      const tempFilesMap = new Map<string, FileInfo>();
      filesToUpload.forEach(file => {
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

      // Procesar cada archivo
      let successfulUploads = 0;
      for (let i = 0; i < filesToUpload.length; i++) {
          const file = filesToUpload[i];
          const tempFileId = tempFilesArray[i].id;
          console.log(`[FileUploadHook ${questionId}] Procesando archivo ${i + 1}/${filesToUpload.length}: ${file.name} (TempID: ${tempFileId})`);
          setCurrentFileIndex(i + 1);

          let finalUploadedFile: UploadedFile | null = null; // Para guardar los datos del archivo final
          let uploadError = false;

          try {
              // 1. Obtener URL prefirmada de subida del backend
              const getUploadUrlEndpoint = `${API_BASE_URL}/research/${researchId}/cognitive-task/upload-url`;
              console.log(`[FileUploadHook ${questionId}] Llamando a API: POST ${getUploadUrlEndpoint}`);
              const apiResponse = await fetch(getUploadUrlEndpoint, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                      fileName: file.name,
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
                      'Content-Type': file.type
                  },
                  body: file
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
                    url: URL.createObjectURL(file), // Mantener URL local para preview si se desea o buscar la presigned de descarga?
                    status: 'uploaded',
                    isLoading: false,
                    progress: 100,
                    questionId: questionId
                };

                setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
                    const updatedQuestions = [...prevData.questions];
                    const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
                    if (questionIndex !== -1 && updatedQuestions[questionIndex].files) {
                        const filesAsInfo: FileInfo[] = updatedQuestions[questionIndex].files.map(asFileInfo);
                        // Reemplazar el temporal por el final usando el tempFileId
                        updatedQuestions[questionIndex].files = filesAsInfo.map(f => 
                            f.id === tempFileId ? finalFileState : f
                        );
                         console.log(`[FileUploadHook ${questionId}] Archivo ${file.name} (TempID: ${tempFileId}) actualizado a estado 'uploaded' con s3Key: ${finalFileState.s3Key}`);
                        saveFilesToLocalStorage(updatedQuestions); // Guardar en localStorage después de cada subida exitosa
                    }
                    return { ...prevData, questions: updatedQuestions };
                });
          }
          // Actualizar progreso general (incluso si hubo error en este archivo)
          setUploadProgress(((i + 1) / filesToUpload.length) * 100); 

      } // Fin del bucle for

      console.log(`[FileUploadHook ${questionId}] Bucle de subida finalizado. ${successfulUploads}/${filesToUpload.length} archivos exitosos.`);
      setIsUploading(false);
      if (successfulUploads === filesToUpload.length) {
         // toast.success(`${successfulUploads} archivo(s) subido(s) exitosamente.`); // Quizás no mostrar si todo ok?
      } else if (successfulUploads > 0) {
         // Usar toast normal con icono de advertencia
         toast(`${successfulUploads}/${filesToUpload.length} archivos subidos. Algunos fallaron. ⚠️`);
      } else {
         // El toast de error ya se mostró dentro del bucle
      }

  }, [researchId, token, setFormData, saveFilesToLocalStorage]);

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

      // Marcar para eliminación PENDIENTE en el estado local
      // La eliminación real de S3 y DB ocurre en el `update` del controlador principal
      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
          const updatedQuestions = prevData.questions.map(q => {
              if (q.id === questionId && q.files) {
                  // Marcar el archivo específico como pendiente
                  const updatedFiles = q.files.map(f => 
                      f.id === fileId ? { ...asFileInfo(f), status: 'pending-delete' as const } : asFileInfo(f)
                  );
                  return { ...q, files: updatedFiles };
              }
              return q;
          });
          saveFilesToLocalStorage(updatedQuestions); // Guardar estado con archivo marcado
          return { ...prevData, questions: updatedQuestions };
      });
      
      toast.success(`Archivo ${fileToDelete.name} marcado para eliminar. Guarda los cambios para confirmar.`);
      
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