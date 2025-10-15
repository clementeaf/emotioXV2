import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  CognitiveTaskFormData,
  UploadedFile
} from 'shared/interfaces/cognitive-task.interface';

import { useAuth } from '@/providers/AuthProvider';
import { cognitiveTaskService } from '@/services/cognitiveTaskService';
import { toastHelpers } from '@/utils/toast';

import {
  logFormDebugInfo
} from '../../CognitiveTaskFormHelpers';
import {
  QUERY_KEYS
} from '../constants';
import type { ErrorModalData, Question, UICognitiveTaskFormData } from '../types';
import { ValidationErrors } from '../types';
import { debugQuestionsToSendLocal, filterValidQuestionsLocal } from '../utils/validateRequiredFields';

import { QuestionType as GlobalQuestionType } from 'shared/interfaces/question-types.enum';
import { useCognitiveTaskFileUpload } from './useCognitiveTaskFileUpload';
import { useCognitiveTaskModals } from './useCognitiveTaskModals';
import { DEFAULT_STATE as DEFAULT_COGNITIVE_TASK_STATE, useCognitiveTaskState } from './useCognitiveTaskState';
import { useCognitiveTaskValidation } from './useCognitiveTaskValidation';

type QuestionType = 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'linear_scale' | 'ranking' | 'navigation_flow' | 'preference_test';

interface UIUploadedFile extends UploadedFile {
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete';
  isLoading?: boolean;
  progress?: number;
  questionId?: string;
}

interface ExtendedUploadedFile extends UploadedFile {
  isLoading?: boolean;
  progress?: number;
  error?: boolean;
  url: string;
  questionId?: string;
  status?: 'uploaded' | 'uploading' | 'error' | 'pending-delete';
}

interface UseCognitiveTaskFormResult {
  formData: UICognitiveTaskFormData;
  cognitiveTaskId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  questionTypes: { id: QuestionType; label: string; description: string }[];

  handleQuestionChange: (questionId: string, updates: Partial<Question>) => void;
  handleAddChoice: (questionId: string) => void;
  handleRemoveChoice: (questionId: string, choiceId: string) => void;
  handleAddQuestion: (type: string) => void;
  handleRandomizeChange: (checked: boolean) => void;
  handleFileUpload: (questionId: string, files: FileList) => Promise<void>;
  handleMultipleFilesUpload: (questionId: string, files: FileList) => Promise<void>;
  handleFileDelete: (questionId: string, fileId: string) => Promise<void>;

  handleSave: () => void;
  handlePreview: () => void;
  handleDelete: () => void;
  confirmDelete: () => void;

  validationErrors: ValidationErrors | null;
  validateForm: () => ValidationErrors | null;

  showConfirmModal: boolean;
  confirmAndSave: () => void;
  cancelSave: () => void;

  isUploading: boolean;
  uploadProgress: number;
  currentFileIndex: number;
  totalFiles: number;

  modalError: ErrorModalData | null;
  modalVisible: boolean;
  closeModal: () => void;
  showJsonPreview: boolean;
  closeJsonModal: () => void;
  jsonToSend: string;
  pendingAction: 'save' | 'preview' | null;
  continueWithAction: () => void;

  isEmpty: boolean;
}

const QUESTION_TYPES = [
  { id: 'short_text' as QuestionType, label: 'Texto Corto', description: 'Respuesta corta de texto' },
  { id: 'long_text' as QuestionType, label: 'Texto Largo', description: 'Respuesta larga de texto' },
  { id: 'single_choice' as QuestionType, label: 'Opción Única', description: 'Selecciona una opción' },
  { id: 'multiple_choice' as QuestionType, label: 'Opción Múltiple', description: 'Selecciona varias opciones' },
  { id: 'linear_scale' as QuestionType, label: 'Escala Lineal', description: 'Escala numérica' },
  { id: 'ranking' as QuestionType, label: 'Ranking', description: 'Ordenar opciones' },
  { id: 'navigation_flow' as QuestionType, label: 'Flujo de Navegación', description: 'Prueba de navegación' },
  { id: 'preference_test' as QuestionType, label: 'Prueba de Preferencia', description: 'Test A/B' }
];

declare global {
  interface Window {
    _lastMutationTimestamp?: number;
  }
}

// Función helper para mapear tipos Cognitive Task al ENUM
const getCognitiveQuestionType = (type: string): string => {
  // Si el tipo ya es un valor del enum, lo devolvemos tal cual
  if (Object.values(GlobalQuestionType).includes(type as GlobalQuestionType)) {
    return type;
  }
  switch (type) {
    case 'long_text': return GlobalQuestionType.COGNITIVE_LONG_TEXT;
    case 'multiple_choice': return GlobalQuestionType.COGNITIVE_MULTIPLE_CHOICE;
    case 'single_choice': return GlobalQuestionType.COGNITIVE_SINGLE_CHOICE;
    case 'rating': return GlobalQuestionType.COGNITIVE_RATING;
    case 'ranking': return GlobalQuestionType.COGNITIVE_RANKING;
    default: return `cognitive_${type}`;
  }
};

export const useCognitiveTaskForm = (
  researchId?: string,
  onSave?: (data: any) => void
): UseCognitiveTaskFormResult => {
  const queryClient = useQueryClient();
  const [cognitiveTaskId, setCognitiveTaskId] = useState<string | null>(null);
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;
  const {
    formData,
    setFormData,
    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleRandomizeChange
  } = useCognitiveTaskState({});
  const modals = useCognitiveTaskModals();
  const { validationErrors, validateForm: runValidation } = useCognitiveTaskValidation();
  const {
    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete: originalHandleFileDelete,
    loadFilesFromLocalStorage
  } = useCognitiveTaskFileUpload({ researchId, formData, setFormData });
  const { data: cognitiveTaskData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId],
    queryFn: async () => {
      try {
        if (!isAuthenticated || !token || !researchId) {
          logFormDebugInfo('queryFn-precondition-fail', null, null, {
            isAuthenticated,
            hasToken: !!token,
            researchId
          });
          return null;
        }

        logFormDebugInfo('queryFn-pre-fetch', null, null, { researchId });

        if (window._lastMutationTimestamp && Date.now() - window._lastMutationTimestamp < 1000) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const response = await cognitiveTaskService.getByResearchId(researchId);

        logFormDebugInfo('queryFn-post-fetch', response);

        if (response && (!response.researchId || !Array.isArray(response.questions))) {
          logFormDebugInfo('queryFn-invalid-structure', response, new Error('Estructura de datos incompleta'));
        }

        return response;
      } catch (error: any) {
        logFormDebugInfo('queryFn-error', null, error, { researchId });

        if (error && error.message?.includes('404')) {
          return null;
        }

        try {
          const localFiles = loadFilesFromLocalStorage();
          if (localFiles && Object.keys(localFiles).length > 0) {
            return null;
          }
        } catch (localError) {
        }

        return null;
      }
    },
    enabled: !!researchId && isAuthenticated,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const [isEmpty, setIsEmpty] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (cognitiveTaskData) {
        const processedData = {
          ...cognitiveTaskData,
          questions: cognitiveTaskData.questions.map(question => {
            // ✅ FIX: Normalizar tipo al cargar desde backend (remover prefijo cognitive_)
            const normalizedQuestion = {
              ...question,
              type: question.type.startsWith('cognitive_')
                ? question.type.replace('cognitive_', '')
                : question.type
            };

            if (normalizedQuestion.files && normalizedQuestion.files.length > 0) {
              const existingQuestion = formData.questions.find(q => q.id === normalizedQuestion.id);

              const processedFiles = normalizedQuestion.files.map(file => {
                const existingFile = existingQuestion?.files?.find(f => f.id === file.id);

                // Priorizar hitZones del backend si están disponibles, sino usar los del estado local
                let hitZonesToUse = undefined;

                if (file.hitZones && file.hitZones.length > 0) {
                  // Usar hitZones del backend (datos guardados)
                  hitZonesToUse = file.hitZones.map((hz: any) => {
                    if (hz.x !== undefined) {
                      return hz;
                    }
                    return {
                      id: hz.id,
                      x: hz.region.x,
                      y: hz.region.y,
                      width: hz.region.width,
                      height: hz.region.height
                    };
                  });
                } else if (existingFile?.hitZones && existingFile.hitZones.length > 0) {
                  // Solo usar hitZones del estado local si no hay datos del backend
                  hitZonesToUse = existingFile.hitZones;
                }

                return {
                  ...file,
                  hitZones: hitZonesToUse
                };
              });
              return { ...normalizedQuestion, files: processedFiles };
            }
            return normalizedQuestion;
          })
        };

        setFormData(processedData);
        setCognitiveTaskId((cognitiveTaskData as any).id || null);
      } else {
        setFormData({
          ...DEFAULT_COGNITIVE_TASK_STATE,
          researchId: researchId || ''
        });
        setCognitiveTaskId(null);
      }
    }

    if (cognitiveTaskData === null && !isLoading) {
      setIsEmpty(true);
    } else {
      setIsEmpty(false);
    }
  }, [cognitiveTaskData, isLoading, researchId, setFormData]);

  const saveMutation = useMutation<CognitiveTaskFormData, unknown, CognitiveTaskFormData>({
    mutationFn: async (dataToSave: CognitiveTaskFormData): Promise<CognitiveTaskFormData> => {
      if (!researchId) { throw new Error('ID de investigación no encontrado'); }

      logFormDebugInfo('pre-save', dataToSave, null, { cognitiveTaskId });

      return cognitiveTaskService.save(researchId, convertToSharedFormat(dataToSave));
    },
    onSuccess: (data) => {
      const responseWithId = data as CognitiveTaskFormData & { id?: string };
      if (responseWithId.id && !cognitiveTaskId) {
        setCognitiveTaskId(responseWithId.id);
      }

      // ✅ FIX: Comentar invalidación que causa recarga y pérdida de imágenes
      // queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, researchId] });
      modals.closeModal();
      // Usar toast en lugar de modal para éxito
      toastHelpers.saveSuccess('Configuración de tareas cognitivas');
      if (onSave) { onSave(data); }
    },
    onError: (error) => {
      modals.showErrorModal({
        title: 'Error al Guardar',
        message: (error && typeof error === 'object' && 'message' in error) ? (error as any).message : 'Ocurrió un error inesperado.',
        type: 'error'
      });
    },
  });

  const { mutate: deleteMutation, isPending: isDeleting } = useMutation<void, Error, string>({
    mutationFn: (id: string) => {
      return cognitiveTaskService.deleteByResearchId(id);
    },
    onSuccess: (_, deletedResearchId) => {
      // Usar toast en lugar de modal para éxito
      toastHelpers.deleteSuccess('Configuración de tareas cognitivas');
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.COGNITIVE_TASK, deletedResearchId] });
      setFormData({
        ...DEFAULT_COGNITIVE_TASK_STATE,
        researchId: deletedResearchId || ''
      });
      setCognitiveTaskId(null);
    },
    onError: (error, deletedResearchId) => {
      modals.showErrorModal({
        title: 'Error al eliminar',
        message: `No se pudo eliminar la configuración para la investigación ${deletedResearchId}. ${error.message}`,
        type: 'error'
      });
    }
  });

  const handleAddQuestion = useCallback((type: string) => {
    // Normalizar el tipo: remover prefijo cognitive_ si existe
    const normalizedType = type.startsWith('cognitive_') ? type.replace('cognitive_', '') : type;

    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: normalizedType,
      title: '',
      description: '',
      required: true,
      showConditionally: false,
      deviceFrame: false,
      questionKey: `${getCognitiveQuestionType(normalizedType)}_q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...(normalizedType === 'single_choice' || normalizedType === 'multiple_choice' || normalizedType === 'ranking' ? {
        choices: [
          { id: '1', text: '', isQualify: false, isDisqualify: false },
          { id: '2', text: '', isQualify: false, isDisqualify: false }
        ]
      } : {}),
      ...(normalizedType === 'linear_scale' ? {
        scaleConfig: { startValue: 1, endValue: 5 }
      } : {}),
      ...(normalizedType === 'navigation_flow' || normalizedType === 'preference_test' ? {
        files: []
      } : {})
    };

    setFormData((prev: UICognitiveTaskFormData) => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  }, [setFormData]);

  const validateCurrentForm = useCallback((): ValidationErrors | null => {
    const dataToValidate = { questions: formData.questions };
    return runValidation(dataToValidate, researchId);
  }, [formData.questions, researchId, runValidation]);

  const handlePreview = useCallback(() => {
    // Generar HTML para la vista previa directamente (como en SmartVOC)
    const questionsHTML = formData.questions.map((question, index) => {
      const questionNumber = index + 1;
      let questionContent = '';

      // Normalizar el tipo de pregunta (quitar prefijo cognitive_ si existe)
      const normalizedType = question.type.startsWith('cognitive_') 
        ? question.type.replace('cognitive_', '') 
        : question.type;

      switch (normalizedType) {
        case 'short_text':
          questionContent = `
            <div class="form-field">
              <label class="sr-only">Respuesta de texto corto</label>
              <input type="text" name="question-${question.id}" placeholder="${question.answerPlaceholder || 'Tu respuesta'}" class="input-text">
            </div>
          `;
          break;
        case 'long_text':
          questionContent = `
            <div class="form-field">
              <label class="sr-only">Respuesta de texto largo</label>
              <textarea name="question-${question.id}" rows="4" placeholder="${question.answerPlaceholder || 'Tu respuesta'}" class="textarea"></textarea>
            </div>
          `;
          break;
        case 'single_choice':
          questionContent = `
            <fieldset class="choices-container">
              <legend class="sr-only">Seleccione una opción</legend>
              <div class="choices">
                ${question.choices?.map((choice: any, choiceIndex: number) => `
                  <div class="choice">
                    <label class="choice-label">
                      <input type="radio" name="question-${question.id}" value="${choiceIndex}" class="radio-input">
                      <span class="choice-text">${choice.text || `Opción ${choiceIndex + 1}`}</span>
                    </label>
                  </div>
                `).join('') || '<p>No hay opciones disponibles</p>'}
              </div>
            </fieldset>
          `;
          break;
        case 'multiple_choice':
          questionContent = `
            <fieldset class="choices-container">
              <legend class="sr-only">Seleccione una o más opciones</legend>
              <div class="choices">
                ${question.choices?.map((choice: any, choiceIndex: number) => `
                  <div class="choice">
                    <label class="choice-label">
                      <input type="checkbox" name="question-${question.id}" value="${choiceIndex}" class="checkbox-input">
                      <span class="choice-text">${choice.text || `Opción ${choiceIndex + 1}`}</span>
                    </label>
                  </div>
                `).join('') || '<p>No hay opciones disponibles</p>'}
              </div>
            </fieldset>
          `;
          break;
        case 'linear_scale':
          const scaleStart = question.scaleConfig?.startValue || 1;
          const scaleEnd = question.scaleConfig?.endValue || 5;
          const startLabel = question.scaleConfig?.startLabel || '';
          const endLabel = question.scaleConfig?.endLabel || '';
          
          questionContent = `
            <fieldset class="scale-container">
              <legend class="sr-only">Seleccione un valor en la escala</legend>
              <div class="linear-scale">
                ${Array.from({ length: scaleEnd - scaleStart + 1 }, (_, i) => scaleStart + i).map(value => `
                  <div class="scale-option">
                    <label class="scale-label">
                      <input type="radio" name="question-${question.id}" value="${value}" class="scale-input">
                      <span class="scale-text">${value}</span>
                    </label>
                  </div>
                `).join('')}
              </div>
              ${startLabel || endLabel ? `
                <div class="scale-labels" style="display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.875rem; color: #64748b;">
                  <span>${startLabel}</span>
                  <span>${endLabel}</span>
                </div>
              ` : ''}
            </fieldset>
          `;
          break;
        case 'ranking':
          questionContent = `
            <div class="ranking">
              ${question.choices?.map((choice: any, choiceIndex: number) => `
                <div class="ranking-item">
                  <span class="ranking-number">${choiceIndex + 1}</span>
                  <span>${choice.text || `Opción ${choiceIndex + 1}`}</span>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 20px;">
              <input type="text" placeholder="Tu respuesta">
            </div>
          `;
          break;
        case 'navigation_flow':
          const navigationFiles = question.files || [];
          if (navigationFiles.length > 0) {
            questionContent = `
              <div class="file-preview">
                <div style="text-align: center; margin-bottom: 1rem;">
                  <h4 style="margin-bottom: 0.5rem; color: #374151;">Imagen de navegación</h4>
                  <p style="color: #6b7280; font-size: 0.875rem;">Haz clic en las áreas marcadas para continuar</p>
                </div>
                ${navigationFiles.map((file: any, fileIndex: number) => `
                  <div class="file-item">
                    <img src="${file.url || file.preview}" alt="${file.name || 'Imagen de navegación'}" 
                         style="max-width: 100%; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
                    <div class="file-name">${file.name || `Imagen ${fileIndex + 1}`}</div>
                    ${file.hitZones && file.hitZones.length > 0 ? `
                      <div style="margin-top: 0.5rem; font-size: 0.75rem; color: #6b7280;">
                        ${file.hitZones.length} zona(s) de clic configurada(s)
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `;
          } else {
            questionContent = `
              <div style="text-align: center; padding: 2rem; background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px;">
                <p style="color: #6b7280; margin: 0;">No hay imágenes configuradas para el flujo de navegación</p>
              </div>
            `;
          }
          break;
        case 'preference_test':
          const preferenceFiles = question.files || [];
          if (preferenceFiles.length >= 2) {
            questionContent = `
              <div class="file-preview">
                <div style="text-align: center; margin-bottom: 1rem;">
                  <h4 style="margin-bottom: 0.5rem; color: #374151;">Prueba de Preferencia A/B</h4>
                  <p style="color: #6b7280; font-size: 0.875rem;">Selecciona la opción que prefieras</p>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; max-width: 600px; margin: 0 auto;">
                  ${preferenceFiles.slice(0, 2).map((file: any, fileIndex: number) => `
                    <div class="file-item" style="text-align: center;">
                      <div style="border: 2px solid #e5e7eb; border-radius: 8px; padding: 1rem; cursor: pointer; transition: border-color 0.2s;" 
                           onmouseover="this.style.borderColor='#3b82f6'" 
                           onmouseout="this.style.borderColor='#e5e7eb'">
                        <img src="${file.url || file.preview}" alt="${file.name || 'Opción A/B'}" 
                             style="max-width: 100%; border-radius: 4px;">
                        <div class="file-name" style="margin-top: 0.5rem; font-weight: 500;">
                          Opción ${fileIndex === 0 ? 'A' : 'B'}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          } else {
            questionContent = `
              <div style="text-align: center; padding: 2rem; background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px;">
                <p style="color: #6b7280; margin: 0;">Se necesitan al menos 2 imágenes para la prueba de preferencia</p>
              </div>
            `;
          }
          break;
        default:
          questionContent = '<p style="color: #666;">Tipo de pregunta no compatible con la vista previa.</p>';
      }

      return `
        <div class="question">
          <div class="question-number">Pregunta ${questionNumber}</div>
          <div class="question-title">
            ${question.title || 'Pregunta sin título'}
            ${question.required ? '<span class="required">*</span>' : ''}
          </div>
          ${question.description ? `<div class="question-description">${question.description}</div>` : ''}
          ${questionContent}
        </div>
      `;
    }).join('');

    // Abrir ventana de vista previa (como en SmartVOC)
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista previa de tarea cognitiva</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              background: #f9fafb;
              min-height: 100vh;
              padding: 40px 20px;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .badge {
              position: fixed;
              top: 20px;
              right: 20px;
              background: rgba(0,0,0,0.6);
              color: white;
              padding: 6px 12px;
              font-size: 12px;
              border-radius: 4px;
              font-weight: 500;
            }
            .question-section {
              background: white;
              padding: 48px 32px;
              margin-bottom: 24px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 24px;
            }
            .question-title {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              text-align: center;
              max-width: 600px;
            }
            .instructions {
              font-size: 14px;
              color: #6b7280;
              text-align: center;
              font-style: italic;
              max-width: 600px;
            }
            .question {
              padding: 1.5rem;
              background-color: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 2rem;
            }
            .question-number {
              font-size: 0.875rem;
              color: #64748b;
              margin-bottom: 0.5rem;
            }
            .question-title {
              font-size: 1.25rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #0f172a;
            }
            .question-description {
              margin-bottom: 1rem;
              color: #475569;
            }
            .required {
              color: #ef4444;
              margin-left: 0.25rem;
            }
            .form-field {
              margin-top: 1rem;
            }
            .sr-only {
              position: absolute;
              width: 1px;
              height: 1px;
              padding: 0;
              margin: -1px;
              overflow: hidden;
              clip: rect(0, 0, 0, 0);
              white-space: nowrap;
              border-width: 0;
            }
            .input-text, .textarea {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              font-size: 1rem;
            }
            .choices-container {
              border: none;
              padding: 0;
              margin: 0;
            }
            .choices {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              margin-top: 1rem;
            }
            .choice {
              margin: 0;
            }
            .choice-label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;
            }
            .choice-text {
              font-size: 1rem;
              color: #334155;
            }
            .scale-container {
              border: none;
              padding: 0;
              margin: 0;
            }
            .linear-scale {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(40px, 1fr));
              gap: 0.5rem;
              margin-top: 1rem;
            }
            .scale-option {
              text-align: center;
            }
            .scale-label {
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
            }
            .scale-text {
              font-size: 0.875rem;
              color: #64748b;
              margin-top: 0.25rem;
            }
            .radio-input, .checkbox-input, .scale-input {
              margin: 0;
            }
            .submit-btn {
              margin-top: 2rem;
              padding: 0.75rem 1.5rem;
              background-color: #2563eb;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              font-weight: 500;
              cursor: pointer;
              align-self: center;
            }
            .submit-btn:hover {
              background-color: #1d4ed8;
            }
            .ranking-item {
              display: flex;
              align-items: center;
              gap: 0.75rem;
              padding: 0.75rem;
              background-color: #fff;
              border: 1px solid #e2e8f0;
              border-radius: 4px;
              margin-bottom: 0.5rem;
            }
            .ranking-number {
              font-weight: 600;
              color: #64748b;
            }
            .file-preview {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              margin-top: 1rem;
            }
            .file-item {
              text-align: center;
            }
            .file-item img {
              max-width: 100%;
              border-radius: 4px;
              border: 1px solid #e2e8f0;
            }
            .file-name {
              font-size: 0.875rem;
              color: #64748b;
              margin-top: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div class="badge">Vista Previa</div>
          <div class="container">
            <form>
              ${questionsHTML}
            </form>
          </div>
        </body>
        </html>
      `;
      
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    }
  }, [formData.questions]);

  const handleSave = () => {
    const errors = runValidation(formData, researchId);
    if (errors && Object.keys(errors).length > 0) {
      const errorMessages = Object.entries(errors)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\\n');

      modals.showErrorModal({
        title: 'Errores de Validación',
        message: `Por favor, corrige los siguientes errores:\n\n${errorMessages}`,
        type: 'warning'
      });
      return;
    }

    const enrichedDataToSend = {
      ...formData,
      questions: formData.questions.map(q => ({
        ...q,
        questionKey: getCognitiveQuestionType(q.type),
        type: q.type.startsWith('cognitive_') ? q.type : `cognitive_${q.type}`
      }))
    };

    const dataToSend = convertToSharedFormat(enrichedDataToSend);

    console.log('🔍 DATA ANTES DE ENVIAR AL BACKEND:', JSON.stringify(dataToSend, null, 2));
    console.log('🔍 PREGUNTAS CON FILES:', dataToSend.questions.filter(q => q.files && q.files.length > 0).map(q => ({
      id: q.id,
      title: q.title,
      filesCount: q.files?.length,
      files: q.files
    })));

    saveMutation.mutate(dataToSend);
  };

  const continueWithAction = () => {
    if (modals.pendingAction === 'save') {
      const dataToSend = formData;
      const enrichedDataToSend = {
        ...dataToSend,
        questions: dataToSend.questions.map(q => ({
          ...q,
          questionKey: getCognitiveQuestionType(q.type),
          // ✅ FIX: No duplicar prefijo cognitive_
          type: q.type.startsWith('cognitive_') ? q.type : `cognitive_${q.type}`
        }))
      };
      saveMutation.mutate(convertToSharedFormat(enrichedDataToSend));
      modals.closeJsonModal();
    }
  };

  const handleDelete = () => {
    modals.openDeleteModal();
  };

  const confirmDelete = async () => {
    modals.closeDeleteModal();

    if (researchId) {
      deleteMutation(researchId);
    } else {
      modals.showErrorModal({
        title: 'Error',
        message: 'No se puede eliminar la configuración porque no se ha proporcionado un ID de investigación.',
        type: 'error'
      });
    }
  };

  const convertToSharedFormat = (localData: UICognitiveTaskFormData): CognitiveTaskFormData => {
    return {
      researchId: localData.researchId,
      questions: localData.questions.map(q => {
        const cleanQuestion = {
          ...q,
          type: q.type as any
        };

        // Limpiar archivos: remover campos UI-específicos antes de enviar al backend
        if (cleanQuestion.files && cleanQuestion.files.length > 0) {
          cleanQuestion.files = cleanQuestion.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            url: file.url,
            s3Key: file.s3Key,
            ...(file.hitZones && file.hitZones.length > 0 ? { hitZones: file.hitZones } : {})
          }));
        }

        return cleanQuestion;
      }),
      randomizeQuestions: localData.randomizeQuestions,
      metadata: localData.metadata
    };
  };

  return {
    formData,
    cognitiveTaskId,
    isLoading,
    isSaving: saveMutation.isPending,
    questionTypes: QUESTION_TYPES,

    handleQuestionChange,
    handleAddChoice,
    handleRemoveChoice,
    handleAddQuestion,
    handleRandomizeChange,
    handleFileUpload,
    handleMultipleFilesUpload,
    handleFileDelete: originalHandleFileDelete,
    handleSave,
    handlePreview,
    handleDelete,
    confirmDelete,

    validationErrors,
    validateForm: validateCurrentForm,

    showConfirmModal: false,
    confirmAndSave: continueWithAction,
    cancelSave: continueWithAction,

    isUploading,
    uploadProgress,
    currentFileIndex,
    totalFiles,
    continueWithAction,

    ...modals,

    isEmpty,
  };
};
