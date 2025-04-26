import { useState, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '@/services'; // Asegurar path correcto
import { Question, UploadedFile } from 'shared/interfaces/cognitive-task.interface';
import { CognitiveTaskFormData } from './useCognitiveTaskForm'; // Asumiendo que se exporta

// Tipos locales necesarios
interface ExtendedUploadedFile extends UploadedFile {
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  url: string; // URL puede ser blob temporal o S3 final
  questionId?: string; 
}

interface UseCognitiveTaskFileUploadProps {
  researchId?: string;
  formData: CognitiveTaskFormData; // Aceptar tipo completo
  setFormData: Dispatch<SetStateAction<CognitiveTaskFormData>>; // Aceptar setter del tipo completo
}

interface UseCognitiveTaskFileUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>; // Hacer async si es necesario
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>; // Hacer async si es necesario
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;
  loadFilesFromLocalStorage: () => Record<string, ExtendedUploadedFile[]> | null;
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

  // --- Lógica de LocalStorage --- 
  const saveFilesToLocalStorage = useCallback((questions: Question[]) => {
    if (!researchId) return;
    try {
      const filesMap: Record<string, ExtendedUploadedFile[]> = {};
      questions.forEach(question => {
        if (question.files && question.files.length > 0) {
          const validFiles = question.files.map(file => ({
            ...file,
            isLoading: false,
            progress: 100
          }));
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

  const loadFilesFromLocalStorage = useCallback((): Record<string, ExtendedUploadedFile[]> | null => {
    if (!researchId) return null;
    try {
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      if (!savedFilesJson) return null;
      
      const savedFiles = JSON.parse(savedFilesJson) as Record<string, ExtendedUploadedFile[]>;
      console.log('[FileUploadHook] Archivos recuperados de localStorage para devolver:', savedFiles);
      
      Object.keys(savedFiles).forEach(questionId => {
        savedFiles[questionId] = savedFiles[questionId].map(file => ({
          ...file,
          isLoading: false,
          progress: 100,
          error: false,
        }));
      });
      
      return savedFiles;

    } catch (error) {
      console.error('[FileUploadHook] Error recuperando de localStorage:', error);
      return null;
    }
  }, [researchId]);

  // --- Lógica de Carga/Eliminación de Archivos --- 

  // handleFileUpload (lógica de simulación/s3Service simplificada)
  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
      if (!researchId || files.length === 0) return;
      
      // <<< LOG 1: Incoming FileList >>>
      console.log(`[FileUploadHook ${questionId}] handleFileUpload called with FileList length:`, files.length, files);

      const questionIndex = formData.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) return;
      
      const filesToUpload = Array.from(files);
      setIsUploading(true);
      setTotalFiles(filesToUpload.length);
      setCurrentFileIndex(0);
      setUploadProgress(0);

      const tempFiles: ExtendedUploadedFile[] = filesToUpload.map((file, index) => ({
          id: `${questionId}_${uuidv4()}`, // Generar ID único
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          s3Key: '',
          isLoading: true,
          progress: 0,
          error: false,
          questionId: questionId
      }));

      // <<< LOG 2: Generated Temp Files >>>
      console.log(`[FileUploadHook ${questionId}] Generated tempFiles:`, JSON.stringify(tempFiles.map(f => ({ id: f.id, name: f.name }))));

      // Añadir temporales al estado
      setFormData((prevData: CognitiveTaskFormData) => {
          const updatedQuestions = [...prevData.questions];
          const existingFiles = updatedQuestions[questionIndex].files || [];
          updatedQuestions[questionIndex].files = [...existingFiles, ...tempFiles];
          // <<< LOG 3: State After Adding Temp Files >>>
          console.log(`[FileUploadHook ${questionId}] State after adding temp files:`, JSON.stringify(updatedQuestions[questionIndex].files.map(f => f.id)));
          return { ...prevData, questions: updatedQuestions };
      });

      // Simulación/Subida real
      try {
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const tempFile = tempFiles[i]; // Obtener temp file correspondiente por índice

            // <<< LOG 4: Processing file in loop >>>
            console.log(`[FileUploadHook ${questionId}] Processing file in loop index ${i}:`, file.name, `(Temp ID: ${tempFile.id})`);

            setCurrentFileIndex(i + 1);
            setUploadProgress(((i + 1) / filesToUpload.length) * 100);
            
            // *** Lógica de subida real a S3 iría aquí ***
            // Simulando éxito por ahora:
            await new Promise(resolve => setTimeout(resolve, 50)); // Simular retraso de red
            const cleanFileName = file.name.replace(/\s+/g, '_');
            // Asegurar unicidad en S3 Key también si es necesario
            const s3Key = `cognitive-task-files/${researchId}/${questionId}/${cleanFileName}_${tempFile.id.split('_').pop()}`; 
            const simulatedUrl = `https://placeholder-bucket.s3.amazonaws.com/${s3Key}`;
            
            // Actualizar estado del archivo específico
            setFormData((prevData: CognitiveTaskFormData) => {
                const updatedQuestions = prevData.questions.map((q: Question) => {
                    if (q.id === questionId && q.files) {
                    const updatedFiles = q.files.map((f: ExtendedUploadedFile) => 
                        f.id === tempFile.id // Comparar con el ID único temporal
                        ? { ...f, url: simulatedUrl, s3Key: s3Key, isLoading: false, progress: 100, error: false } 
                        : f
                    );
                    return { ...q, files: updatedFiles };
                    }
                    return q;
                });
                // <<< LOG 5: State After Updating Single File Status >>>
                const currentQFiles = updatedQuestions.find(q=>q.id===questionId)?.files;
                console.log(`[FileUploadHook ${questionId}] State after updating file ${tempFile.id}:`, JSON.stringify(currentQFiles?.map(f => ({ id: f.id, name: f.name }))));
                saveFilesToLocalStorage(updatedQuestions); // Guardar después de cada actualización?
                return { ...prevData, questions: updatedQuestions };
            });
          }
          // <<< LOG 6: Upload Loop Finished >>>
          console.log(`[FileUploadHook ${questionId}] Upload loop finished.`);
          toast.success('Archivos subidos (simulado)'); // Ajustar si es subida real
      } catch (error) {
          console.error('Error simulando subida:', error);
          toast.error('Error simulando subida');
          // Marcar como error (ejemplo)
          setFormData((prevData: CognitiveTaskFormData) => {
              const updatedQuestions = prevData.questions.map((q: Question) => {
                  if (q.id === questionId && q.files) {
                      // Marcar todos los archivos subidos en este lote como error?
                      const tempFileIds = new Set(tempFiles.map(tf => tf.id));
                      const updatedFiles = q.files.map((f: ExtendedUploadedFile) => 
                          tempFileIds.has(f.id) ? { ...f, error: true, isLoading: false } : f
                      );
                      return { ...q, files: updatedFiles };
                  }
                  return q;
              });
              return { ...prevData, questions: updatedQuestions };
          });
      } finally {
          setIsUploading(false);
      }
  }, [researchId, formData.questions, setFormData, saveFilesToLocalStorage]);

  // handleMultipleFilesUpload (reusa la lógica de handleFileUpload en bucle)
  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
      // Prácticamente la misma lógica que handleFileUpload, ya que procesa uno a uno.
      // Se podría unificar o mantener separado si la lógica futura difiere.
      await handleFileUpload(questionId, files);
  }, [handleFileUpload]); // Depende de handleFileUpload

  // handleFileDelete
  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
      try {
        const question = formData.questions.find(q => q.id === questionId);
        const file = question?.files?.find(f => f.id === fileId) as ExtendedUploadedFile | undefined;
        if (!file) throw new Error('Archivo no encontrado en el estado');

        const isTemporaryFile = file.url?.startsWith('blob:') || !file.s3Key;

        // Eliminar de S3 si aplica (Llamada original)
        if (!isTemporaryFile && file.s3Key) {
          console.log(`[FileUploadHook] Intentando eliminar de S3 (original): ${file.s3Key}`);
          try {
            await s3Service.deleteFile(file.s3Key);
            toast.success('Archivo eliminado de S3.');
          } catch (s3Error) {
            console.error('Error eliminando de S3:', s3Error);
            // Mostrar error específico de S3
            const message = s3Error instanceof Error ? s3Error.message : 'Error desconocido al eliminar de S3';
            toast.error(`Error eliminando archivo de S3: ${message}`);
            // Detenerse si falla S3
            return; 
          }
        }

        // Revocar URL temporal
        if (isTemporaryFile && file.url?.startsWith('blob:')) {
          console.log('[FileUploadHook] Revocando URL blob:', file.url);
          URL.revokeObjectURL(file.url);
        }

        // Eliminar del estado y actualizar localStorage
        console.log(`[FileUploadHook] Eliminando archivo del estado local: ${fileId}`);
        setFormData((prevData: CognitiveTaskFormData) => {
          const updatedQuestions = prevData.questions.map((q: Question) =>
            q.id === questionId && q.files
              ? { ...q, files: q.files.filter((f: UploadedFile) => f.id !== fileId) }
              : q
          );
          saveFilesToLocalStorage(updatedQuestions);
          return { ...prevData, questions: updatedQuestions };
        });
        
        toast.success('Archivo eliminado localmente.');

      } catch (error) {
          // Error general
          console.error('[FileUploadHook] Error eliminando archivo:', error);
          const message = error instanceof Error ? error.message : 'Error desconocido';
          toast.error(`Error al eliminar archivo: ${message}`);
      }
  }, [formData.questions, setFormData, saveFilesToLocalStorage]); // Dependencias originales

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