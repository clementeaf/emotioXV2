import { useCallback, useEffect, useState } from 'react';

import welcomeScreenService from '@/services/welcomeScreenService';
import { QuestionType } from '../../../../../../shared/interfaces/question-types.enum';
// import { WelcomeScreenData } from '../types';

import {
    ErrorModalData,
    UseWelcomeScreenFormResult,
    ValidationErrors,
} from '../types';

// Definir tipo local para WelcomeScreenRecord si es necesario
interface WelcomeScreenRecord extends WelcomeScreenData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Definir WelcomeScreenData localmente para evitar errores de importación
interface WelcomeScreenData {
  id?: string;
  researchId: string;
  isEnabled?: boolean;
  title: string;
  message: string;
  startButtonText: string;
  createdAt?: string;
  updatedAt?: string;
  subtitle?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  theme?: string;
  disclaimer?: string;
  customCss?: string;
  metadata?: {
    version?: string;
    lastUpdated?: string;
    lastModifiedBy?: string;
  };
  questionKey: string;
  [key: string]: any;
}

// Definir ErrorModalData localmente para aceptar 'success'
// interface ErrorModalData {
//   title: string;
//   message: string;
//   type: 'error' | 'warning' | 'info' | 'success';
// }

// Valor inicial: Usar WelcomeScreenData importada.
// Necesita definir metadata si WelcomeScreenData la requiere.
const INITIAL_FORM_DATA: WelcomeScreenData = {
  researchId: '',
  isEnabled: true,
  title: '',
  message: '',
  startButtonText: '',
  questionKey: '', // Asegura que siempre existe
  // Añadir metadata inicial para cumplir el tipo
  metadata: {
    // version, lastUpdated, lastModifiedBy son opcionales según la interfaz del servicio
  }
};

export const useWelcomeScreenForm = (researchId: string): UseWelcomeScreenFormResult => {
  // Convertir 'current' a un ID válido cuando sea necesario (revisar esta lógica si aplica)
  const actualResearchId = researchId === 'current' ? '' : researchId; // Usar '' si es current y no hay ID real

  const [formData, setFormData] = useState<WelcomeScreenData>(INITIAL_FORM_DATA);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [existingScreen, setExistingScreen] = useState<any>(null);
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  // Estado para disparar un refetch manual después de guardar
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mover fetchData fuera de useEffect y envolver con useCallback
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsEmpty(false);
    try {
      if (!actualResearchId) {
        setFormData({ ...INITIAL_FORM_DATA, researchId: '', questionKey: QuestionType.WELCOME_SCREEN });
        setExistingScreen(null);
        setIsLoading(false);
        setIsEmpty(true);
        return;
      }

      // [FIX] Eliminar cualquier cacheo local de inexistencia
      try {
        localStorage.removeItem(`welcome_screen_resource_${actualResearchId}`);
      } catch (e) { /* ignorar errores de localStorage */ }

      const fetchedRecord: any = await welcomeScreenService.getByResearchId(actualResearchId);
      if (fetchedRecord) {
        setExistingScreen(fetchedRecord);
        const formDataToSet: WelcomeScreenData = {
          researchId: fetchedRecord.researchId,
          isEnabled: fetchedRecord.isEnabled ?? true,
          title: fetchedRecord.title ?? '',
          message: fetchedRecord.message ?? '',
          startButtonText: fetchedRecord.startButtonText ?? '',
          subtitle: fetchedRecord.subtitle ?? '',
          logoUrl: fetchedRecord.logoUrl ?? '',
          backgroundImageUrl: fetchedRecord.backgroundImageUrl ?? '',
          backgroundColor: fetchedRecord.backgroundColor ?? '',
          textColor: fetchedRecord.textColor ?? '',
          theme: fetchedRecord.theme ?? '',
          disclaimer: fetchedRecord.disclaimer ?? '',
          customCss: fetchedRecord.customCss ?? '',
          metadata: fetchedRecord.metadata,
          questionKey: QuestionType.WELCOME_SCREEN
        };
        setFormData(formDataToSet);
      } else {
        setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId, questionKey: QuestionType.WELCOME_SCREEN });
        setExistingScreen(null);
        setIsEmpty(true);
      }
    } catch (error: any) {
      // Si el error es 404, tratar como vacío
      if (error?.statusCode === 404 || error?.message?.includes('not found') || error?.message?.includes('WELCOME_SCREEN_NOT_FOUND')) {
        setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId, questionKey: QuestionType.WELCOME_SCREEN });
        setExistingScreen(null);
        setIsEmpty(true);
      } else {
        // Solo mostrar en consola si NO es 404
        console.error('[useWelcomeScreenForm] Error al cargar configuración:', error);
        setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId, questionKey: QuestionType.WELCOME_SCREEN });
        setExistingScreen(null);
        setModalError({
          title: 'Error',
          message: 'No se pudo cargar la configuración de la pantalla de bienvenida.',
          type: 'error'
        });
        setModalVisible(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [actualResearchId, setIsLoading, setFormData, setExistingScreen, setModalError, setModalVisible]);

  useEffect(() => {
    fetchData();
    // Dependencias de useEffect: fetchData y refetchTrigger
  }, [fetchData, refetchTrigger]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    if (!formData.title) {errors.title = 'El título es requerido';}
    if (!formData.message) {errors.message = 'El mensaje es requerido';}
    if (!formData.startButtonText) {errors.startButtonText = 'El texto del botón es requerido';}

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = useCallback((field: keyof WelcomeScreenData, value: any): void => {
    setFormData((prev: WelcomeScreenData) => ({
      ...prev,
      [field]: value,
      metadata: {
        ...(prev.metadata || INITIAL_FORM_DATA.metadata),
        version: prev.metadata?.version || '1.0',
        lastUpdated: new Date().toISOString(),
        lastModifiedBy: prev.metadata?.lastModifiedBy || 'user'
      }
    }));
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  }, [validationErrors]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    setIsSaving(true);
    try {
      // Usar formData para los datos a enviar (solo campos editables)
      const dataToSubmit: Partial<WelcomeScreenData> = {
        ...formData,
        questionKey: formData.questionKey === QuestionType.WELCOME_SCREEN ? formData.questionKey : QuestionType.WELCOME_SCREEN
      } as any;
      // Eliminar researchId si no es necesario en el payload de PUT/POST
      // delete dataToSubmit.researchId;

      let resultRecord: WelcomeScreenRecord;

      // Usar existingScreen.id para determinar si es UPDATE
      if (existingScreen?.id && actualResearchId) {
        // console.log(`Llamando a updateForResearch con screenId: ${existingScreen.id}`);
        // Pasar solo los datos de formData al servicio update
        resultRecord = await welcomeScreenService.updateForResearch(
          actualResearchId,
          existingScreen.id,
          dataToSubmit // Enviar solo los campos editables
        );
      } else if (actualResearchId) {
        // console.log(`Llamando a createForResearch para researchId: ${actualResearchId}`);
        // Crear el payload completo para create
        const createPayload: WelcomeScreenData = {
          ...INITIAL_FORM_DATA, // Empezar con defaults
          ...dataToSubmit,       // Sobrescribir con valores del form
          researchId: actualResearchId, // Asegurar researchId
          questionKey: QuestionType.WELCOME_SCREEN
        };
        resultRecord = await welcomeScreenService.createForResearch(
          actualResearchId,
          createPayload
        );
      } else {
        throw new Error('No hay researchId válido para guardar.');
      }

      // --- Actualizar Estado DESPUÉS de Éxito ---
      // 1. Preparar los datos para el formulario desde el resultado
      const formDataFromResult: WelcomeScreenData = {
        researchId: resultRecord.researchId,
        isEnabled: resultRecord.isEnabled ?? true,
        title: resultRecord.title ?? '',
        message: resultRecord.message ?? '',
        startButtonText: resultRecord.startButtonText ?? '',
        subtitle: resultRecord.subtitle ?? '',
        logoUrl: resultRecord.logoUrl ?? '',
        backgroundImageUrl: resultRecord.backgroundImageUrl ?? '',
        backgroundColor: resultRecord.backgroundColor ?? '',
        textColor: resultRecord.textColor ?? '',
        theme: resultRecord.theme ?? '',
        disclaimer: resultRecord.disclaimer ?? '',
        customCss: resultRecord.customCss ?? '',
        metadata: resultRecord.metadata,
        questionKey: QuestionType.WELCOME_SCREEN
      };

      // 2. Actualizar el estado del formulario PRIMERO
      setFormData(formDataFromResult);
      // 3. Disparar refetch para sincronizar con backend
      setRefetchTrigger(prev => prev + 1);

      // 4. Actualizar el registro existente
      setExistingScreen(resultRecord);

      // 5. Mostrar el modal de éxito DESPUÉS
      setModalError({
        title: 'Éxito',
        message: 'Pantalla de bienvenida guardada correctamente.',
        type: 'info'
      });
      setModalVisible(true);

    } catch (error) {
      console.error('Error saving welcome screen:', error);
      setModalError({
        title: 'Error al Guardar',
        message: `No se pudo guardar la pantalla de bienvenida: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      setModalError({
        title: 'Campos incompletos',
        message: 'Por favor, complete todos los campos requeridos antes de previsualizar.',
        type: 'warning'
      });
      setModalVisible(true);
      return;
    }

    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      const { title, message, startButtonText } = formData;
      const previewHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista previa - ${title}</title>
          <style>
            body { font-family: sans-serif; margin: 40px; background-color: #f4f4f4; display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 80px); }
            .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 600px; width: 90%; }
            h1 { color: #333; margin-bottom: 15px; }
            .message { color: #555; line-height: 1.6; margin-bottom: 25px; white-space: pre-wrap; }
            button { background-color: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; }
            button:hover { background-color: #0056b3; }
            .badge { position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; font-size: 12px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="badge">Vista Previa</div>
          <div class="container">
            <h1>${title}</h1>
            <div class="message">${message.replace(/\n/g, '<br>')}</div>
            <button>${startButtonText}</button>
          </div>
        </body>
        </html>
      `;
      previewWindow.document.write(previewHtml);
      previewWindow.document.close();
    } else {
      setModalError({
        title: 'Error de Vista Previa',
        message: 'No se pudo abrir la ventana de vista previa. Por favor, habilite las ventanas emergentes.',
        type: 'error'
      });
      setModalVisible(true);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!existingScreen?.id || !actualResearchId) return;
    setIsDeleting(true);
    try {
      await welcomeScreenService.delete(actualResearchId, existingScreen.id);
      setExistingScreen(null);
      setFormData({ ...INITIAL_FORM_DATA, researchId: actualResearchId, questionKey: QuestionType.WELCOME_SCREEN });
      setModalError({
        title: 'Eliminado',
        message: 'La pantalla de bienvenida fue eliminada correctamente.',
        type: 'success' as any
      });
      setModalVisible(true);
      setIsEmpty(true);
    } catch (error: any) {
      setModalError({
        title: 'Error al eliminar',
        message: error?.message || 'No se pudo eliminar la pantalla de bienvenida.',
        type: 'error'
      });
      setModalVisible(true);
    } finally {
      setIsDeleting(false);
    }
  }, [existingScreen, actualResearchId, setExistingScreen, setFormData, setModalError, setModalVisible]);

  const closeModal = () => {
    setModalVisible(false);
    setModalError(null);
  };

  return {
    formData,
    setFormData,
    validationErrors,
    isLoading,
    isSaving,
    modalError,
    modalVisible,
    handleChange,
    handleSubmit,
    handlePreview,
    closeModal,
    existingScreen,
    isEmpty,
    handleDelete,
    isDeleting,
    showDelete: !!existingScreen?.id,
  };
};
