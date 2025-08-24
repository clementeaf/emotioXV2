import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import type { HitZone, UploadedFile } from 'shared/interfaces/cognitive-task.interface';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '@/providers/AuthProvider';
import { apiClient } from '@/config/api';

import type { Question, UICognitiveTaskFormData } from '../types'; // Usar tipos locales

// Definir tipos locales que faltan
interface HitzoneArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UIFile extends UploadedFile {
  status?: 'uploading' | 'uploaded' | 'pending-delete' | 'error';
  progress?: number;
  isLoading?: boolean;
  questionId?: string;
  hitZones?: any;
}

function mapHitZonesToHitzoneAreas(hitZones?: HitZone[] | HitzoneArea[]): HitzoneArea[] | undefined {
  if (!hitZones) {return undefined;}
  if ((hitZones as HitzoneArea[])[0]?.x !== undefined) {
    return hitZones as HitzoneArea[];
  }

  return (hitZones as HitZone[]).map(hz => ({
    id: hz.id,
    x: hz.region.x,
    y: hz.region.y,
    width: hz.region.width,
    height: hz.region.height
  }));
}

const asUIFile = (file: any): UIFile => ({
  id: file.id || uuidv4(),
  name: file.name || file.fileName || '',
  size: file.size || 0,
  type: file.type || file.contentType || '',
  url: file.fileUrl || file.url || '',
  s3Key: file.s3Key,
  status: file.status || 'uploaded',
  progress: file.progress,
  error: file.error,
  isLoading: file.isLoading,
  questionId: file.questionId,
  hitZones: mapHitZonesToHitzoneAreas(file.hitZones)
});

interface UseCognitiveTaskFileUploadProps {
  researchId?: string;
  formData: UICognitiveTaskFormData;
  setFormData: Dispatch<SetStateAction<UICognitiveTaskFormData>>;
}

interface UseCognitiveTaskFileUploadResult {
  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>;
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;
  loadFilesFromLocalStorage: () => Record<string, UIFile[]> | null;
}


function normalizeFileName(name: string): string {
  return name
    .normalize('NFD').replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/\.+/g, '.')
    .toLowerCase();
}

const cleanFileName = (fileName: string): string => {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
};

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

  const saveFilesToLocalStorage = useCallback((questions: Question[]) => {
    if (!researchId) {return;}
    try {
      const filesMap: Record<string, UIFile[]> = {};
      questions.forEach(question => {
        if (question.files && question.files.length > 0) {
          const validFiles = (question.files as any[]).map(asUIFile).filter((f: UIFile) => f.status !== 'error') as UIFile[];
          if (validFiles.length > 0) {
            filesMap[question.id] = validFiles;
          }
        }
      });
      if (Object.keys(filesMap).length > 0) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        localStorage.setItem(storageKey, JSON.stringify(filesMap));
      }
    } catch (error) {
      console.error('[FileUploadHook] Error guardando en localStorage:', error);
    }
  }, [researchId]);

  const loadFilesFromLocalStorage = useCallback((): Record<string, UIFile[]> | null => {
    if (!researchId) {return null;}
    try {
      const storageKey = `cognitive_task_temp_files_${researchId}`;
      const savedFilesJson = localStorage.getItem(storageKey);
      if (!savedFilesJson) {return null;}
      const savedFiles = JSON.parse(savedFilesJson) as Record<string, any[]>;
      const filesMapResult: Record<string, UIFile[]> = {};
      Object.keys(savedFiles).forEach(questionId => {
        filesMapResult[questionId] = (savedFiles[questionId] as any[]).map(asUIFile).filter((f: UIFile) => f.status !== 'error') as UIFile[];
      });
      return filesMapResult;
    } catch (error) {
      console.error('[FileUploadHook] Error recuperando de localStorage:', error);
      return null;
    }
  }, [researchId]);

  const handleFileUpload = useCallback(async (questionId: string, files: FileList) => {
    if (!researchId || files.length === 0 || !token) {
      console.warn(`[FileUploadHook ${questionId}] Subida abortada: Faltan researchId, archivos o token.`);
      toast.error('No se pudo iniciar la subida. Falta información necesaria o autenticación.');
      return;
    }

    setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
      const updatedQuestions = prevData.questions.map(q => {
        if (q.id === questionId && q.files && q.files.length > 0) {
          const cleanedFiles = q.files.filter(f => {
            const fileInfo = asUIFile(f);
            return fileInfo.status !== 'error' &&
                            !(fileInfo.status === 'uploading' && fileInfo.isLoading);
          });

          const uniqueFileMap = new Map<string, any>();
          cleanedFiles.forEach(f => {
            const fileInfo = asUIFile(f);
            if (fileInfo.status === 'uploaded') {
              const key = `${fileInfo.name}_${fileInfo.size}`;
              if (!uniqueFileMap.has(key) ||
                              (!uniqueFileMap.get(key).url && fileInfo.url)) {
                uniqueFileMap.set(key, f);
              }
            } else {
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

    let currentFilesForQuestion: UIFile[] = [];
    const questionIndex = formData.questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1 && formData.questions[questionIndex].files) {
      currentFilesForQuestion = formData.questions[questionIndex].files
        .map(asUIFile)
        .filter(f => f.status !== 'pending-delete' && f.status !== 'error');
    }

    const filesToProcess = filesToUploadInput.filter(newFile => {
      const isDuplicate = currentFilesForQuestion.some(existingFile => {
        const nameMatch = existingFile.name === newFile.name;
        const sizeMatch = existingFile.size === newFile.size;
        return nameMatch && sizeMatch;
      });
      return !isDuplicate;
    });
    const processedFileCount = filesToProcess.length;
    const skippedFileCount = initialFileCount - processedFileCount;

    if (skippedFileCount > 0) {
      toast(`${skippedFileCount} archivo(s) omitido(s) por ser duplicado(s).`);
    }

    if (filesToProcess.length === 0) {
      return;
    }

    setIsUploading(true);
    setTotalFiles(filesToProcess.length);
    setCurrentFileIndex(0);
    setUploadProgress(0);

    const tempFilesMap = new Map<string, UIFile>();
    filesToProcess.forEach(file => {
      const normalizedFileName = normalizeFileName(file.name);
      const tempFile: UIFile = {
        id: `${questionId}_${uuidv4()}`,
        name: normalizedFileName,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        s3Key: '',
        status: 'uploading',
        progress: 0,
        isLoading: true,
        questionId: questionId,
        hitZones: 'hitZones' in file ? mapHitZonesToHitzoneAreas((file as any).hitZones) : undefined
      };
      tempFilesMap.set(tempFile.id, tempFile);
    });
    const tempFilesArray = Array.from(tempFilesMap.values());

    setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
      const updatedQuestions = [...prevData.questions];
      const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {return prevData;}
      const existingFiles = (updatedQuestions[questionIndex].files || []).map(asUIFile);
      const filteredExistingFiles = existingFiles.filter(
        f =>
          !(
            (f.status === 'uploading' || f.isLoading === true) &&
                filesToProcess.some(
                  file => file.name === f.name && file.size === f.size
                )
          )
      );
      updatedQuestions[questionIndex].files = [...filteredExistingFiles, ...tempFilesArray];
      return { ...prevData, questions: updatedQuestions };
    });

    let successfulUploads = 0;
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const tempFileId = tempFilesArray[i].id;
      const normalizedFileName = tempFilesArray[i].name;
      const fileToUpload = new File([file], normalizedFileName, { type: file.type });
      setCurrentFileIndex(i + 1);

      let finalUploadedFile: UIFile | null = null;
      let uploadError = false;

      try {
        // Configurar el token en apiClient para esta operación
        if (token) {
          apiClient.setAuthToken(token);
        }

        const result = await apiClient.post('cognitiveTask', 'getUploadUrl', {
          fileName: normalizedFileName,
          fileSize: file.size,
          fileType: file.type,
          mimeType: file.type,
          contentType: file.type,
          questionId: questionId
        }, { researchId });
        if (!result || !result.uploadUrl || !result.file || !result.file.s3Key) {
          console.error(`[FileUploadHook ${questionId}] Respuesta inválida obteniendo URL de subida:`, result);
          throw new Error('Respuesta inválida del servidor al obtener URL de subida.');
        }

        const { uploadUrl, file: backendFileInfo } = result;
        finalUploadedFile = backendFileInfo;

        // Upload directo a S3 usando URL presignada (NO usar apiClient aquí)
        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': fileToUpload.type
          },
          body: fileToUpload
        });

        if (!s3Response.ok) {
          const s3ErrorBody = await s3Response.text();
          console.error(`[FileUpload] Error ${s3Response.status} subiendo a S3:`, s3ErrorBody);
          throw new Error(`Error subiendo archivo: ${s3Response.status === 403 ? 'URL expirada' : 'Error del servidor'}`);
        }

        successfulUploads++;

      } catch (error: any) {
        console.error(`[FileUploadHook ${questionId}] Error procesando archivo ${file.name}:`, error);
        toast.error(`Error subiendo ${file.name}: ${error.message || 'Error desconocido'}`);
        uploadError = true;
        setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
          const updatedQuestions = prevData.questions.map(q => {
            if (q.id === questionId && q.files) {
              const filesAsInfo: UIFile[] = q.files.map(asUIFile);
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

      if (!uploadError && finalUploadedFile) {
        const finalFileState: UIFile = {
          ...asUIFile(finalUploadedFile),
          id: tempFileId,
          url: (finalUploadedFile as any).fileUrl || finalUploadedFile.url,
          status: 'uploaded',
          isLoading: false,
          progress: 100,
          questionId: questionId,
          hitZones: mapHitZonesToHitzoneAreas(finalUploadedFile.hitZones)
        };

        setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
          const updatedQuestions = [...prevData.questions];
          const questionIndex = updatedQuestions.findIndex(q => q.id === questionId);
          if (questionIndex !== -1 && updatedQuestions[questionIndex].files) {
            let currentFiles = updatedQuestions[questionIndex].files.map(asUIFile);
            currentFiles = currentFiles.filter(f => f.id !== tempFileId);
            currentFiles = currentFiles.filter(f => {
              if (
                (f.status === 'uploading' || f.isLoading === true) &&
                            f.name === finalFileState.name &&
                            f.size === finalFileState.size
              ) {
                return false;
              }
              return true;
            });
            const mergedFile = {
              ...finalFileState,
              status: 'uploaded',
              isLoading: false
            } as UIFile;
            updatedQuestions[questionIndex].files = [...currentFiles, mergedFile];
          }
          return { ...prevData, questions: updatedQuestions };
        });
      }
      setUploadProgress(((i + 1) / filesToProcess.length) * 100);

    }

    setIsUploading(false);

    if (successfulUploads > 0) {
      setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
        const updatedQuestions = prevData.questions.map(q => {
          if (q.id === questionId && q.files && q.files.length > 0) {
            const uniqueFileMap = new Map<string, UIFile>();
            const filesAsInfo = q.files.map(asUIFile)
              .sort((a, b) => {
                if (a.status === 'uploaded' && b.status !== 'uploaded') {return -1;}
                if (a.status !== 'uploaded' && b.status === 'uploaded') {return 1;}
                return 0;
              });
            filesAsInfo.forEach(file => {
              if (file.status === 'uploaded') {
                const key = `${file.name}_${file.size}`;
                if (!uniqueFileMap.has(key) || !uniqueFileMap.get(key)?.url) {
                  uniqueFileMap.set(key, file);
                }
              } else if (file.status === 'pending-delete') {
                uniqueFileMap.set(file.id, file);
              } else {
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
        saveFilesToLocalStorage(updatedQuestions);
        return { ...prevData, questions: updatedQuestions };
      });
    }

    if (successfulUploads === filesToProcess.length) {
      // All files uploaded successfully
    } else if (successfulUploads > 0) {
      toast(`${successfulUploads}/${filesToProcess.length} archivos subidos. Algunos fallaron. ⚠️`);
    }

  }, [researchId, token, formData.questions, setFormData, saveFilesToLocalStorage]);

  const handleMultipleFilesUpload = useCallback(async (questionId: string, files: FileList) => {
    await handleFileUpload(questionId, files);
  }, [handleFileUpload]);

  const handleFileDelete = useCallback(async (questionId: string, fileId: string) => {
    const fileToDelete = formData.questions
      .find((q: Question) => q.id === questionId)
      ?.files?.find((f: UIFile) => f.id === fileId);

    if (!fileToDelete) {
      console.error(`[FileUploadHook] Archivo no encontrado para eliminar: ${fileId}`);
      return;
    }

    setFormData((prevData: UICognitiveTaskFormData): UICognitiveTaskFormData => {
      const updatedQuestions = prevData.questions.map((q: Question) => {
        if (q.id === questionId && q.files) {
          const updatedFiles = q.files.filter((f: UIFile) => f.id !== fileId);
          return { ...q, files: updatedFiles };
        }
        return q;
      });

      saveFilesToLocalStorage(updatedQuestions);

      if (researchId) {
        const storageKey = `cognitive_task_temp_files_${researchId}`;
        const savedFilesJson = localStorage.getItem(storageKey);
        if (savedFilesJson) {
          const savedFiles = JSON.parse(savedFilesJson);
          if (savedFiles[questionId]) {
            savedFiles[questionId] = savedFiles[questionId].filter((f: UIFile) => f.id !== fileId);
            if (savedFiles[questionId].length === 0) {
              delete savedFiles[questionId];
            }
            if (Object.keys(savedFiles).length === 0) {
              localStorage.removeItem(storageKey);
            } else {
              localStorage.setItem(storageKey, JSON.stringify(savedFiles));
            }
          }
        }
      }

      return { ...prevData, questions: updatedQuestions };
    });

    toast.success(`Archivo ${fileToDelete.name} eliminado correctamente.`);
  }, [formData.questions, setFormData, saveFilesToLocalStorage, researchId]);

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
