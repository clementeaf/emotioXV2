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
  loadFilesFromLocalStorage: () => void;
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

  const loadFilesFromLocalStorage = useCallback(() => {
    if (!researchId) return;
    try {
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      if (!savedFilesJson) return;
      
      const savedFiles = JSON.parse(savedFilesJson);
      console.log('[FileUploadHook] Recuperando archivos de localStorage', savedFiles);
      
      setFormData((prevData: CognitiveTaskFormData) => {
        const updatedQuestions = prevData.questions.map((question: Question) => {
          const questionFiles = savedFiles[question.id];
          if (questionFiles && questionFiles.length > 0) {
            const existingFileIds = new Set(question.files?.map((f: UploadedFile) => f.id) || []);
            const newFiles = questionFiles.filter((f: UploadedFile) => !existingFileIds.has(f.id));
            if (newFiles.length > 0) {
              const processedNewFiles = newFiles.map((file: UploadedFile) => ({
                ...file,
                isLoading: false,
                progress: 100,
                error: false
              }));
              return {
                ...question,
                files: [...(question.files || []), ...processedNewFiles]
              };
            }
          }
          return question;
        });
        return { ...prevData, questions: updatedQuestions };
      });
    } catch (error) {
      console.error('[FileUploadHook] Error recuperando de localStorage:', error);
    }
  }, [researchId, setFormData]);

  // Efecto para cargar desde localStorage al montar (si hay researchId)
  useEffect(() => {
    if (researchId) {
      loadFilesFromLocalStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [researchId]); // Solo al cambiar researchId

  // --- Lógica de Carga/Eliminación de Archivos --- 

  // handleFileUpload (lógica de simulación/s3Service simplificada)
  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
      if (!researchId || files.length === 0) return;
      
      const questionIndex = formData.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) return;
      
      const filesToUpload = Array.from(files);
      setIsUploading(true);
      setTotalFiles(filesToUpload.length);
      setCurrentFileIndex(0);
      setUploadProgress(0);

      const tempFiles: ExtendedUploadedFile[] = filesToUpload.map((file, index) => ({
          id: `${questionId}_${uuidv4()}`,
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

      // Añadir temporales al estado
      setFormData((prevData: CognitiveTaskFormData) => {
          const updatedQuestions = [...prevData.questions];
          updatedQuestions[questionIndex].files = [...(updatedQuestions[questionIndex].files || []), ...tempFiles];
          return { ...prevData, questions: updatedQuestions };
      });

      // Simulación de subida (igual que en handleMultipleFilesUpload)
      try {
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const tempFile = tempFiles[i];
            setCurrentFileIndex(i + 1);
            setUploadProgress(((i + 1) / filesToUpload.length) * 100);
            await new Promise(resolve => setTimeout(resolve, 50));
            const cleanFileName = file.name.replace(/\s+/g, '_');
            const s3Key = `cognitive-task-files/${researchId}/${questionId}/${cleanFileName}`;
            const simulatedUrl = `https://placeholder-bucket.s3.amazonaws.com/${s3Key}`;
            // Actualizar estado del archivo
            setFormData((prevData: CognitiveTaskFormData) => {
                const updatedQuestions = prevData.questions.map((q: Question) => {
                    if (q.id === questionId && q.files) {
                    const updatedFiles = q.files.map((f: ExtendedUploadedFile) => 
                        f.id === tempFile.id 
                        ? { ...f, url: simulatedUrl, s3Key: s3Key, isLoading: false, progress: 100, error: false } 
                        : f
                    );
                    return { ...q, files: updatedFiles };
                    }
                    return q;
                });
                saveFilesToLocalStorage(updatedQuestions);
                return { ...prevData, questions: updatedQuestions };
            });
          }
          toast.success('Archivos subidos (simulado)');
      } catch (error) {
          console.error('Error simulando subida:', error);
          toast.error('Error simulando subida');
          // Marcar como error
          setFormData((prevData: CognitiveTaskFormData) => {
              const updatedQuestions = prevData.questions.map((q: Question) => {
                  if (q.id === questionId && q.files) {
                      const updatedFiles = q.files.map((f: ExtendedUploadedFile) => ({
                          ...f,
                          error: true
                      }));
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

        // Eliminar de S3 si aplica
        if (!isTemporaryFile && file.s3Key) {
          try {
            await s3Service.deleteFile(file.s3Key);
            toast.success('Archivo eliminado de S3.');
          } catch (s3Error) {
            console.error('Error eliminando de S3:', s3Error);
            toast.error('Error eliminando archivo de S3.');
            // Considerar si detener la eliminación local o continuar
          }
        }

        // Revocar URL temporal
        if (isTemporaryFile && file.url?.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }

        // Eliminar del estado y actualizar localStorage
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
          console.error('[FileUploadHook] Error eliminando archivo:', error);
          toast.error(`Error al eliminar archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
  }, [formData.questions, setFormData, saveFilesToLocalStorage]); // Dependencias

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