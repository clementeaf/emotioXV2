import { useState, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { s3Service } from '@/services'; // Asegurar path correcto
import { Question } from 'shared/interfaces/cognitive-task.interface'; // Quitar UploadedFile si no se usa directo
import { CognitiveTaskFormData } from './useCognitiveTaskForm'; // Asumiendo que se exporta
import { FileInfo } from '../types'; // <-- Importar FileInfo

// Tipos locales necesarios --> Eliminado ExtendedUploadedFile

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
      if (!researchId || files.length === 0) return;
      
      console.log(`[FileUploadHook ${questionId}] handleFileUpload called with FileList length:`, files.length, files);

      const filesToUpload = Array.from(files);
      setIsUploading(true);
      setTotalFiles(filesToUpload.length);
      setCurrentFileIndex(0);
      setUploadProgress(0);

      const tempFiles: FileInfo[] = filesToUpload.map((file): FileInfo => ({
          id: `${questionId}_${uuidv4()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          s3Key: '',
          status: 'uploading',
          progress: 0,
          questionId: questionId
      }));

      console.log(`[FileUploadHook ${questionId}] Generated tempFiles:`, JSON.stringify(tempFiles.map(f => ({ id: f.id, name: f.name }))));

      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
          const updatedQuestions = [...prevData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
          if (questionIndex === -1) return prevData;
          const existingFiles = (updatedQuestions[questionIndex].files || []).map(asFileInfo);
          updatedQuestions[questionIndex].files = [...existingFiles, ...tempFiles];
          console.log(`[FileUploadHook ${questionId}] State after adding temp files:`, JSON.stringify(updatedQuestions[questionIndex].files?.map(f => f.id)));
          return { ...prevData, questions: updatedQuestions };
      });

      try {
          for (let i = 0; i < filesToUpload.length; i++) {
            const file = filesToUpload[i];
            const tempFile = tempFiles[i];

            console.log(`[FileUploadHook ${questionId}] Processing file in loop index ${i}:`, file.name, `(Temp ID: ${tempFile.id})`);

            setCurrentFileIndex(i + 1);
            const currentProgress = ((i + 1) / filesToUpload.length) * 100;
            
            setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => {
              const updatedQuestions = prevData.questions.map((q) => {
                if (q.id === questionId && q.files) {
                  const filesAsInfo: FileInfo[] = q.files.map(asFileInfo);
                  const updatedFiles: FileInfo[] = filesAsInfo.map((f: FileInfo) =>
                    f.id === tempFile.id ? { ...f, progress: currentProgress } : f
                  );
                  return { ...q, files: updatedFiles };
                }
                return q;
              });
              return { ...prevData, questions: updatedQuestions };
            });
            setUploadProgress(currentProgress); 

            await new Promise(resolve => setTimeout(resolve, 50)); 
            const cleanFileName = file.name.replace(/\s+/g, '_');
            const s3Key = `cognitive-task-files/${researchId}/${questionId}/${cleanFileName}_${tempFile.id.split('_').pop()}`;
            const simulatedUrl = `https://placeholder-bucket.s3.amazonaws.com/${s3Key}`;
            
            setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => { 
                const updatedQuestions = prevData.questions.map((q: Question) => {
                    if (q.id === questionId && q.files) {
                      const filesAsInfo: FileInfo[] = q.files.map(asFileInfo);
                      const updatedFiles: FileInfo[] = filesAsInfo.map((f: FileInfo): FileInfo => 
                          f.id === tempFile.id
                          ? { ...f, url: simulatedUrl, s3Key: s3Key, status: 'uploaded', progress: 100 }
                          : f
                      );
                      return { ...q, files: updatedFiles };
                    }
                    return q;
                });
                const currentQ = updatedQuestions.find(q => q.id === questionId);
                const currentQFilesAsInfo = currentQ?.files?.map(asFileInfo);
                
                console.log(`[FileUploadHook ${questionId}] State after updating file ${tempFile.id}:`, 
                  JSON.stringify(currentQFilesAsInfo?.map(f => ({ id: f.id, name: f.name, status: f.status })))
                );
                saveFilesToLocalStorage(updatedQuestions);
                return { ...prevData, questions: updatedQuestions };
            });
          }
          console.log(`[FileUploadHook ${questionId}] Upload loop finished.`);
          toast.success('Archivos subidos (simulado)');
      } catch (error) {
          console.error('Error simulando subida:', error);
          toast.error('Error simulando subida');
          setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => { 
              const updatedQuestions = prevData.questions.map((q: Question) => {
                  if (q.id === questionId && q.files) {
                      const tempFileIds = new Set(tempFiles.map(tf => tf.id));
                      const filesAsInfo: FileInfo[] = q.files.map(asFileInfo);
                      const updatedFiles: FileInfo[] = filesAsInfo.map((f: FileInfo): FileInfo => 
                          tempFileIds.has(f.id) ? { ...f, status: 'error' } : f
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

  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
      await handleFileUpload(questionId, files);
  }, [handleFileUpload]);

  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
      console.log(`[FileUploadHook] Solicitud para marcar como pendiente de eliminación: ${fileId} en pregunta ${questionId}`);
      setFormData((prevData: CognitiveTaskFormData): CognitiveTaskFormData => { 
        const updatedQuestions = prevData.questions.map((q: Question) => {
          if (q.id === questionId && q.files) {
            const filesAsInfo: FileInfo[] = q.files.map(asFileInfo);
            const updatedFiles: FileInfo[] = filesAsInfo.map((f: FileInfo): FileInfo => {
              if (f.id === fileId) {
                if (f.url?.startsWith('blob:')) {
                  console.log('[FileUploadHook] Revocando URL blob al marcar para eliminar:', f.url);
                  URL.revokeObjectURL(f.url);
                }
                console.log(`[FileUploadHook] Marcando archivo ${fileId} como 'pending-delete'`);
                return { ...f, status: 'pending-delete' as const };
              }
              return f;
            });
            return { ...q, files: updatedFiles };
          }
          return q;
        });
        saveFilesToLocalStorage(updatedQuestions);
        return { ...prevData, questions: updatedQuestions };
      });
      toast('Archivo marcado para eliminar. Guarde los cambios para confirmar.', { icon: '🗑️' }); 
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