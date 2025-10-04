import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SmartVOCFormData } from 'shared/interfaces/smart-voc.interface';

import { useAuth } from '@/providers/AuthProvider';


import { QuestionType } from 'shared/interfaces/question-types.enum';
import { SmartVOCQuestion } from '../types';

import { useSmartVOCMutations } from './useSmartVOCMutations';
import { useSmartVOCState } from './useSmartVOCState';
import { useSmartVOCValidation } from './useSmartVOCValidation';

/**
 * Hook principal para gestionar la lógica del formulario SmartVOC
 * Responsabilidad: Orquestar la composición de los otros hooks
 */
export const useSmartVOCForm = (researchId: string) => {
  const { user, token, authLoading } = useAuth();
  const isAuthenticated = !!user && !!token;

  // Componer los hooks especializados
  const {
    formData,
    setFormData,
    smartVocId,
    setSmartVocId,
    validationErrors,
    setValidationErrors,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    resetToDefaultQuestions
  } = useSmartVOCState(researchId);

  const {
    smartVocData,
    isLoading,
    saveMutation,
    isSaving,
    deleteMutation,
    isDeleting,
    modalError,
    modalVisible,
    closeModal,
    showModal,
    refetch
  } = useSmartVOCMutations(researchId, smartVocId || undefined);

  const { validateForm, filterEditedQuestions } = useSmartVOCValidation();

  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);

  // Logging solo en desarrollo
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      //   isAuthenticated,
      //   hasToken: !!token,
      //   researchId,
      //   authLoading
      // });
    }
  }, [isAuthenticated, token, researchId, authLoading]);

  // Efecto para cargar datos existentes siguiendo patrón ThankYouScreen/WelcomeScreen
  useEffect(() => {
    const actualResearchId = researchId === 'current' ? '' : researchId;

    if (!actualResearchId) {
      setIsEmpty(true);
      return;
    }

    if (smartVocData) {
      // Actualizar formData con datos existentes
      setFormData({
        researchId: actualResearchId,
        questions: smartVocData.questions || [],
        randomizeQuestions: smartVocData.randomizeQuestions ?? false,
        smartVocRequired: smartVocData.smartVocRequired ?? true,
        metadata: smartVocData.metadata || {
          createdAt: new Date().toISOString(),
          estimatedCompletionTime: '5-10'
        }
      });

      setIsEmpty(false);

      // Configurar ID si existe
      const responseWithId = smartVocData as SmartVOCFormData & { id?: string };
      if (responseWithId?.id) {
        setSmartVocId(responseWithId.id);
      }
    } else if (!isLoading) {
      // No hay datos y no está cargando - mantener estado actual (no interferir con delete manual)
      setIsEmpty(true);
    }
  }, [smartVocData, researchId, isLoading, setFormData, setSmartVocId]);

  // Función para manejar el guardado
  const handleSave = useCallback(async () => {
    const editedQuestions = filterEditedQuestions(formData.questions);

    // Fix: Copiar type desde config si falta
    const fixedQuestions = editedQuestions.map(q => ({
      ...q,
      type: q.type || (q.config && q.config.type) || '',
    }));

    // Añadir una validación inicial: no enviar si no hay preguntas editadas
    if (fixedQuestions.length === 0) {
      toast.error('No has configurado ninguna pregunta. Añade contenido a al menos una pregunta para poder guardar.');
      return;
    }

    // Validación dura: abortar si alguna pregunta no tiene type
    const missingType = fixedQuestions.find(q => !q.type);
    if (missingType) {
      toast.error('Hay preguntas sin tipo definido. Corrige antes de guardar.');
      return;
    }

    // Ahora, validar solo las preguntas que se van a guardar
    const errors = validateForm(fixedQuestions, formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const errorMessages = Object.values(errors).join('\n');
      toast.error(`Por favor, corrige los siguientes errores:\n\n${errorMessages}`, {
        duration: 5000 // Aumentar duración para que se pueda leer
      });
      return;
    }

    // Función helper para mapear tipos SmartVOC al ENUM
    const getSmartVOCQuestionType = (type: string): string => {
      if (!type || typeof type !== 'string') {
        return 'smartvoc_unknown';
      }
      // Si el tipo ya es un valor del enum, lo devolvemos tal cual
      if (Object.values(QuestionType).includes(type as QuestionType)) {
        return type;
      }
      switch (type.toUpperCase()) {
        case 'CSAT': return QuestionType.SMARTVOC_CSAT;
        case 'CES': return QuestionType.SMARTVOC_CES;
        case 'CV': return QuestionType.SMARTVOC_CV;
        case 'NEV': return QuestionType.SMARTVOC_NEV;
        case 'NPS': return QuestionType.SMARTVOC_NPS;
        case 'VOC': return QuestionType.SMARTVOC_VOC;
        default: return `smartvoc_${type}`;
      }
    };

    // ENRIQUECER TODAS LAS PREGUNTAS ANTES DE ENVIAR
    const cleanedData: SmartVOCFormData = {
      ...formData,
      questions: fixedQuestions.map(q => {
        const questionType = q.type?.toUpperCase() || '';
        const config = { ...q.config };


        return {
          ...q,
          config,
          questionKey: getSmartVOCQuestionType(q.type),
          type: q.type, // Type is already QuestionType
          description: q.description || q.title,
          required: q.type !== QuestionType.SMARTVOC_VOC,
        };
      }),
    };

    try {
      await saveMutation.mutateAsync(cleanedData);
    } catch (error) {
      // Error already handled by mutation hook
    }
  }, [formData, filterEditedQuestions, validateForm, setValidationErrors, saveMutation, smartVocId]);

  // Abre el modal de confirmación
  const handleDelete = useCallback(() => {
    setDeleteModalOpen(true);
  }, []);

  // Ejecuta la eliminación
  const confirmDelete = useCallback(async () => {
    setDeleteModalOpen(false); // Cierra el modal primero
    try {
      // Reset COMPLETO del formData al estado inicial PRIMERO
      setSmartVocId(null);
      setIsEmpty(true);
      const actualResearchId = researchId === 'current' ? '' : researchId;
      setFormData({
        researchId: actualResearchId,
        questions: [
          {
            id: QuestionType.SMARTVOC_CSAT,
            type: QuestionType.SMARTVOC_CSAT,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'stars'
            }
          },
          {
            id: QuestionType.SMARTVOC_CES,
            type: QuestionType.SMARTVOC_CES,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 1, end: 5 },
              startLabel: '',
              endLabel: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_CV,
            type: QuestionType.SMARTVOC_CV,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 1, end: 5 },
              startLabel: '',
              endLabel: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_NEV,
            type: QuestionType.SMARTVOC_NEV,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'emojis'
            }
          },
          {
            id: QuestionType.SMARTVOC_NPS,
            type: QuestionType.SMARTVOC_NPS,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'scale',
              scaleRange: { start: 0, end: 10 },
              startLabel: '',
              endLabel: ''
            }
          },
          {
            id: QuestionType.SMARTVOC_VOC,
            type: QuestionType.SMARTVOC_VOC,
            title: '',
            description: '',
            instructions: '',
            showConditionally: false,
            config: {
              type: 'text'
            }
          }
        ],
        randomizeQuestions: false,
        smartVocRequired: true,
        metadata: {
          createdAt: new Date().toISOString(),
          estimatedCompletionTime: '5-10'
        }
      });

      // DESPUÉS eliminar del servidor
      await deleteMutation.mutateAsync();

    } catch (error: unknown) {
      // El hook de mutación ya muestra un toast/modal en caso de error
    }
  }, [deleteMutation, setFormData, setSmartVocId, researchId]);

  // Función para manejar la previsualización
  const handlePreview = useCallback(() => {
    const editedQuestions = filterEditedQuestions(formData.questions);

    if (editedQuestions.length === 0) {
      toast.error('No hay preguntas configuradas para previsualizar.');
      return;
    }

    // Generar HTML para cada tipo de pregunta basado en public-tests
    const generateQuestionHTML = (question: SmartVOCQuestion, index: number) => {
      const questionText = question.title || 'Sin texto de pregunta';
      const instructions = question.instructions ?
        `<p class="instructions">${question.instructions}</p>` : '';

      let inputHTML = '';

      const questionType = question.type?.toUpperCase() || '';

      switch (true) {
        case questionType.includes('CSAT'):
          const ratingType = question.config?.type || 'stars';
          const csatStartLabel = question.config?.startLabel || '1 - Muy insatisfecho';
          const csatEndLabel = question.config?.endLabel || '5 - Muy satisfecho';

          if (ratingType === 'stars') {
            inputHTML = `
              <div class="rating-container">
                <div class="stars-row">
                  ${[1, 2, 3, 4, 5].map(() => `<button class="star-btn">★</button>`).join('')}
                </div>
                <div class="scale-labels">
                  <span>${csatStartLabel}</span>
                  <span>${csatEndLabel}</span>
                </div>
              </div>
            `;
          } else if (ratingType === 'numbers') {
            inputHTML = `
              <div class="number-scale">
                ${[1, 2, 3, 4, 5].map(n => `<button class="number-btn">${n}</button>`).join('')}
              </div>
              <div class="scale-labels">
                <span>${csatStartLabel}</span>
                <span>${csatEndLabel}</span>
              </div>
            `;
          } else if (ratingType === 'emojis') {
            inputHTML = `
              <div class="emotions-layout">
                <div class="emotion-row custom">
                  ${['😞', '😐', '🙂', '😊', '😍'].map(emoji => `
                    <button class="emotion-btn green-1">${emoji}</button>
                  `).join('')}
                </div>
              </div>
            `;
          }
          break;

        case questionType.includes('CES'):
          const cesStartLabel = question.config?.startLabel || 'Muy difícil';
          const cesEndLabel = question.config?.endLabel || 'Muy fácil';
          const cesScaleStart = question.config?.scaleRange?.start || 1;
          const cesScaleEnd = question.config?.scaleRange?.end || 7;

          inputHTML = `
            <div class="number-scale">
              ${Array.from({ length: cesScaleEnd - cesScaleStart + 1 }, (_, i) => cesScaleStart + i)
                .map(n => `<button class="number-btn">${n}</button>`).join('')}
            </div>
            <div class="scale-labels">
              <span>${cesStartLabel}</span>
              <span>${cesEndLabel}</span>
            </div>
          `;
          break;

        case questionType.includes('NPS'):
          const npsStartLabel = question.config?.startLabel || 'Nada probable';
          const npsEndLabel = question.config?.endLabel || 'Muy probable';
          const npsScaleStart = question.config?.scaleRange?.start || 0;
          const npsScaleEnd = question.config?.scaleRange?.end || 10;

          inputHTML = `
            <div class="number-scale">
              ${Array.from({ length: npsScaleEnd - npsScaleStart + 1 }, (_, i) => npsScaleStart + i)
                .map(n => `<button class="number-btn">${n}</button>`).join('')}
            </div>
            <div class="scale-labels">
              <span>${npsStartLabel}</span>
              <span>${npsEndLabel}</span>
            </div>
          `;
          break;

        case questionType.includes('CV'):
          const cvStartLabel = question.config?.startLabel || 'Muy difícil';
          const cvEndLabel = question.config?.endLabel || 'Muy fácil';
          const cvScaleStart = question.config?.scaleRange?.start || 1;
          const cvScaleEnd = question.config?.scaleRange?.end || 7;

          inputHTML = `
            <div class="number-scale">
              ${Array.from({ length: cvScaleEnd - cvScaleStart + 1 }, (_, i) => cvScaleStart + i)
                .map(n => `<button class="number-btn">${n}</button>`).join('')}
            </div>
            <div class="scale-labels">
              <span>${cvStartLabel}</span>
              <span>${cvEndLabel}</span>
            </div>
          `;
          break;

        case questionType.includes('NEV'):
          const emotions = (question.config as any)?.emotions || [];

          if (emotions.length > 0) {
            // Usar emociones configuradas
            inputHTML = `
              <div class="emotions-layout">
                <div class="emotion-row custom">
                  ${emotions.map((emotion: any) => {
                    const emotionClass = emotion.sentiment === 'positive' ? 'green-1' :
                                       emotion.sentiment === 'neutral' ? 'green-2' : 'red';
                    return `<button class="emotion-btn ${emotionClass}">${emotion.label || emotion.name}</button>`;
                  }).join('')}
                </div>
              </div>
            `;
          } else {
            // Fallback: mostrar emociones por defecto solo si no hay configuración
            inputHTML = `
              <div class="emotions-layout">
                <div class="emotion-row row-1">
                  ${['Feliz', 'Satisfecho', 'Confiado', 'Valorado', 'Cuidado', 'Seguro', 'Enfocado'].map(emotion => `
                    <button class="emotion-btn green-1">${emotion}</button>
                  `).join('')}
                </div>
                <div class="emotion-row row-2">
                  ${['Indulgente', 'Estimulado', 'Exploratorio', 'Interesado', 'Enérgico', 'Descontento'].map(emotion => `
                    <button class="emotion-btn green-2">${emotion}</button>
                  `).join('')}
                </div>
                <div class="emotion-row row-3">
                  ${['Frustrado', 'Irritado', 'Decepción', 'Estresado', 'Infeliz', 'Desatendido', 'Apresurado'].map(emotion => `
                    <button class="emotion-btn red">${emotion}</button>
                  `).join('')}
                </div>
              </div>
            `;
          }
          break;

        case questionType.includes('VOC'):
          const maxLength = (question.config as any)?.maxLength || 500;
          inputHTML = `
            <div class="text-input-container">
              <textarea
                class="text-input"
                placeholder="Escribe tu respuesta aquí..."
                maxlength="${maxLength}"
                rows="5"
              ></textarea>
              <div class="char-count">0 / ${maxLength} caracteres</div>
            </div>
          `;
          break;

        default:
          inputHTML = '<p class="preview-note">Tipo de pregunta no soportado en vista previa</p>';
      }

      return `
        <div class="question-section">
          <h2 class="question-title">${questionText}</h2>
          ${instructions}
          ${inputHTML}
        </div>
      `;
    };

    const questionsHTML = editedQuestions.map(generateQuestionHTML).join('');

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista Previa - Smart VOC</title>
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
            .rating-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 16px;
            }
            .stars-row {
              display: flex;
              gap: 8px;
            }
            .star-btn {
              font-size: 36px;
              background: none;
              border: none;
              color: #d1d5db;
              cursor: pointer;
              transition: all 0.2s;
              padding: 0 4px;
            }
            .star-btn:hover {
              color: #fbbf24;
              transform: scale(1.2);
            }
            .number-scale {
              display: flex;
              gap: 24px;
              justify-content: center;
            }
            .number-btn {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              border: 2px solid #d1d5db;
              background: white;
              color: #374151;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s;
            }
            .number-btn:hover {
              background: #2563eb;
              color: white;
              border-color: #1d4ed8;
            }
            .scale-labels {
              display: flex;
              justify-content: space-between;
              width: 100%;
              max-width: 400px;
              margin-top: 8px;
              font-size: 12px;
              color: #6b7280;
            }
            .emotions-layout {
              display: flex;
              flex-direction: column;
              gap: 12px;
              width: 100%;
              max-width: 700px;
            }
            .emotion-row {
              display: grid;
              gap: 8px;
            }
            .row-1 { grid-template-columns: repeat(7, 1fr); }
            .row-2 { grid-template-columns: repeat(6, 1fr); }
            .row-3 { grid-template-columns: repeat(7, 1fr); }
            .custom { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); }
            .emotion-btn {
              padding: 12px 8px;
              border: 2px solid;
              border-radius: 8px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              text-align: center;
            }
            .emotion-btn.green-1 {
              background: #d1fae5;
              border-color: #a7f3d0;
              color: #065f46;
            }
            .emotion-btn.green-1:hover {
              background: #a7f3d0;
              border-color: #6ee7b7;
            }
            .emotion-btn.green-2 {
              background: #a7f3d0;
              border-color: #6ee7b7;
              color: #047857;
            }
            .emotion-btn.green-2:hover {
              background: #6ee7b7;
              border-color: #34d399;
            }
            .emotion-btn.red {
              background: #fee2e2;
              border-color: #fecaca;
              color: #991b1b;
            }
            .emotion-btn.red:hover {
              background: #fecaca;
              border-color: #fca5a5;
            }
            .emotion-btn:active {
              background: #2563eb;
              color: white;
              border-color: #1d4ed8;
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
            }
            .text-input-container {
              width: 100%;
              max-width: 600px;
            }
            .text-input {
              width: 100%;
              padding: 12px;
              border: 2px solid #d1d5db;
              border-radius: 8px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              transition: border-color 0.2s;
            }
            .text-input:focus {
              outline: none;
              border-color: #2563eb;
            }
            .char-count {
              text-align: right;
              font-size: 12px;
              color: #6b7280;
              margin-top: 4px;
            }
            .preview-note {
              color: #6b7280;
              font-style: italic;
              text-align: center;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div class="badge">Vista Previa</div>
          <div class="container">
            ${questionsHTML}
          </div>
        </body>
        </html>
      `;
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } else {
      toast.error('No se pudo abrir la ventana de vista previa. Por favor, habilite las ventanas emergentes.');
    }
  }, [formData.questions, filterEditedQuestions]);

  return {
    formData,
    questions: formData.questions,
    smartVocId,
    validationErrors,
    isLoading: isLoading || authLoading,
    isSaving,
    modalError,
    modalVisible,
    updateQuestion,
    updateSettings,
    addQuestion,
    removeQuestion,
    handleSave,
    handlePreview,
    handleDelete,
    validateForm: (questionsToValidate: SmartVOCQuestion[]) => validateForm(questionsToValidate, formData),
    closeModal,
    isExisting: !!smartVocId,
    isDeleteModalOpen,
    confirmDelete,
    closeDeleteModal: () => setDeleteModalOpen(false),
    isEmpty
  };
};
