// @ts-nocheck - TODO: Fix all type issues in EyeTracking Recruit components
'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useEyeTrackingSharedData } from '@/hooks/useEyeTrackingSharedData';
import { useErrorLog } from '@/components/utils/ErrorLogger';
import { 
  DemographicQuestionKeys,
  LinkConfigKeys,
  ParameterOptionKeys
} from 'shared/interfaces/eyeTrackingRecruit.interface';

import { useEyeTrackingRecruitState } from './useEyeTrackingRecruitState';
import { useEyeTrackingRecruitMutations } from './useEyeTrackingRecruitMutations';
import { transformAPIToFormData, createInitialFormData } from '../utils/formHelpers';

interface UseEyeTrackingRecruitProps {
  researchId: string;
}

export interface UseEyeTrackingRecruitResult {
  // Data
  formData: ReturnType<typeof useEyeTrackingRecruitState>['formData'];
  stats: ReturnType<typeof useEyeTrackingRecruitState>['stats'];
  
  // Loading states
  loading: boolean;
  saving: boolean;
  
  // UI states
  demographicQuestionsEnabled: boolean;
  linkConfigEnabled: boolean;
  modalError: ReturnType<typeof useEyeTrackingRecruitState>['modalError'];
  modalVisible: boolean;
  apiErrors: ReturnType<typeof useEyeTrackingRecruitState>['apiErrors'];
  qrCodeData: string | null;
  showQRModal: boolean;
  
  // Actions
  updateFormData: (updates: Partial<ReturnType<typeof useEyeTrackingRecruitState>['formData']>) => void;
  saveConfiguration: () => Promise<void>;
  generateLink: () => Promise<string | null>;
  
  // Modal actions
  openErrorModal: (data: ReturnType<typeof useEyeTrackingRecruitState>['modalError']) => void;
  closeErrorModal: () => void;
  openQRModal: (data: string) => void;
  closeQRModal: () => void;
  
  // Demographic question actions
  setDemographicQuestionsEnabled: (enabled: boolean) => void;
  updateDemographicQuestion: (key: DemographicQuestionKeys, updates: Record<string, unknown>) => void;
  
  // Link config actions
  setLinkConfigEnabled: (enabled: boolean) => void;
  updateLinkConfig: (key: LinkConfigKeys, updates: Record<string, unknown>) => void;
  
  // Parameter options actions
  updateParameterOptions: (key: ParameterOptionKeys, value: boolean) => void;
  
  // Quota management
  addQuota: (questionKey: DemographicQuestionKeys, quotaData: Record<string, unknown>) => void;
  updateQuota: (questionKey: DemographicQuestionKeys, quotaId: string, updates: Record<string, unknown>) => void;
  deleteQuota: (questionKey: DemographicQuestionKeys, quotaId: string) => void;
  
  // Utility functions
  checkRequiredFields: () => boolean;
  generateRecruitmentLink: () => string;
}

export function useEyeTrackingRecruit({ researchId }: UseEyeTrackingRecruitProps): UseEyeTrackingRecruitResult {
  const logger = useErrorLog();
  const actualResearchId = researchId === 'current' ? '1234' : researchId;

  // Use state hook
  const state = useEyeTrackingRecruitState(researchId);
  
  // Use mutations hook
  const mutations = useEyeTrackingRecruitMutations(researchId, state.setApiErrors);

  // Get shared data
  const { data: eyeTrackingRecruitData, isLoading: isLoadingConfig } = useEyeTrackingSharedData(actualResearchId, {
    type: 'recruit',
    enabled: !!actualResearchId
  });

  // Process API data when it changes
  useEffect(() => {
    if (isLoadingConfig) return;

    try {
      if (!eyeTrackingRecruitData || !eyeTrackingRecruitData.id) {
        const defaultConfig = createInitialFormData(actualResearchId);
        state.setFormData(defaultConfig);
        state.setDemographicQuestionsEnabledState(false);
        state.setLinkConfigEnabledState(false);
        return;
      }

      const transformedData = transformAPIToFormData(eyeTrackingRecruitData);
      const configData = { 
        ...createInitialFormData(actualResearchId), 
        ...transformedData,
        researchId: actualResearchId
      };

      state.setFormData(configData);

      // Set enabled states based on data
      const hasDemographics = Object.values(configData.demographicQuestions || {}).some(
        (q: unknown) => (q as { enabled?: boolean })?.enabled
      );
      state.setDemographicQuestionsEnabledState(hasDemographics);

      const hasLinkConfig = Object.values(configData.linkConfig || {}).some(
        (value: unknown) => {
          if (typeof value === 'object' && value !== null) {
            return (value as { enabled?: boolean })?.enabled;
          }
          return false;
        }
      );
      state.setLinkConfigEnabledState(hasLinkConfig);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      if ((error as { statusCode?: number })?.statusCode === 404) {
        const defaultConfig = createInitialFormData(actualResearchId);
        state.setFormData(defaultConfig);
        state.setDemographicQuestionsEnabledState(false);
        state.setLinkConfigEnabledState(false);
        return;
      }
      toast.error(`Error al cargar configuración: ${errorMessage}`);
    }
  }, [eyeTrackingRecruitData, isLoadingConfig, actualResearchId, state]);

  // Update loading state and set research URL
  useEffect(() => {
    if (!isLoadingConfig) {
      state.setLoading(false);
      const generatedLink = state.generateRecruitmentLink();
      state.setFormData(prev => ({
        ...prev,
        researchUrl: generatedLink
      }));
    }
  }, [isLoadingConfig, state]);

  // Action implementations
  const updateFormData = useCallback((updates: Partial<typeof state.formData>) => {
    state.setFormData(prev => ({ ...prev, ...updates }));
  }, [state]);

  const saveConfiguration = useCallback(async () => {
    if (!state.checkRequiredFields()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    state.setSaving(true);
    try {
      await mutations.saveConfigMutation.mutateAsync(state.formData);
    } finally {
      state.setSaving(false);
    }
  }, [state, mutations]);

  const generateLink = useCallback(async (): Promise<string | null> => {
    if (!state.formData.id) {
      toast.error('Primero debes guardar la configuración');
      return null;
    }

    try {
      const result = await mutations.generateLinkMutation.mutateAsync(state.formData.id);
      return result?.link || null;
    } catch {
      return null;
    }
  }, [state.formData.id, mutations]);

  // Modal actions
  const openErrorModal = useCallback((data: typeof state.modalError) => {
    state.setModalError(data);
    state.setModalVisible(true);
  }, [state]);

  const closeErrorModal = useCallback(() => {
    state.setModalVisible(false);
    state.setModalError(null);
  }, [state]);

  const openQRModal = useCallback((data: string) => {
    state.setQrCodeData(data);
    state.setShowQRModal(true);
  }, [state]);

  const closeQRModal = useCallback(() => {
    state.setShowQRModal(false);
    state.setQrCodeData(null);
  }, [state]);

  // Demographic question actions
  const setDemographicQuestionsEnabled = useCallback((enabled: boolean) => {
    state.setDemographicQuestionsEnabledState(enabled);
  }, [state]);

  const updateDemographicQuestion = useCallback((key: DemographicQuestionKeys, updates: Record<string, unknown>) => {
    state.setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [key]: {
          ...prev.demographicQuestions[key],
          ...updates
        }
      }
    }));
  }, [state]);

  // Link config actions
  const setLinkConfigEnabled = useCallback((enabled: boolean) => {
    state.setLinkConfigEnabledState(enabled);
  }, [state]);

  const updateLinkConfig = useCallback((key: LinkConfigKeys, updates: Record<string, unknown>) => {
    state.setFormData(prev => ({
      ...prev,
      linkConfig: {
        ...prev.linkConfig,
        [key]: {
          ...prev.linkConfig[key as keyof typeof prev.linkConfig],
          ...updates
        }
      }
    }));
  }, [state]);

  // Parameter options actions
  const updateParameterOptions = useCallback((key: ParameterOptionKeys, value: boolean) => {
    state.setFormData(prev => ({
      ...prev,
      parameterOptions: {
        // @ts-ignore - TODO: Fix parameterOptions type issue
        ...prev.parameterOptions,
        [key]: value
      }
    }));
  }, [state]);

  // Quota management
  const addQuota = useCallback((questionKey: DemographicQuestionKeys, quotaData: Record<string, unknown>) => {
    state.setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [questionKey]: {
          ...prev.demographicQuestions[questionKey],
          quotas: [
            ...(prev.demographicQuestions[questionKey].quotas || []),
            quotaData
          ]
        }
      }
    }));
  }, [state]);

  const updateQuota = useCallback((questionKey: DemographicQuestionKeys, quotaId: string, updates: Record<string, unknown>) => {
    state.setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [questionKey]: {
          ...prev.demographicQuestions[questionKey],
          quotas: prev.demographicQuestions[questionKey].quotas?.map(quota =>
            // @ts-ignore - TODO: Fix quota type casting issue
            (quota as { id: string }).id === quotaId ? { ...quota, ...updates } : quota
          )
        }
      }
    }));
  }, [state]);

  const deleteQuota = useCallback((questionKey: DemographicQuestionKeys, quotaId: string) => {
    state.setFormData(prev => ({
      ...prev,
      demographicQuestions: {
        ...prev.demographicQuestions,
        [questionKey]: {
          ...prev.demographicQuestions[questionKey],
          quotas: prev.demographicQuestions[questionKey].quotas?.filter(quota =>
            // @ts-ignore - TODO: Fix quota type casting issue
            (quota as { id: string }).id !== quotaId
          )
        }
      }
    }));
  }, [state]);

  return {
    // Data
    formData: state.formData,
    stats: state.stats,
    
    // Loading states
    loading: state.loading,
    saving: state.saving || mutations.isLoading,
    
    // UI states
    demographicQuestionsEnabled: state.demographicQuestionsEnabled,
    linkConfigEnabled: state.linkConfigEnabled,
    modalError: state.modalError,
    modalVisible: state.modalVisible,
    apiErrors: state.apiErrors,
    qrCodeData: state.qrCodeData,
    showQRModal: state.showQRModal,
    
    // Actions
    updateFormData,
    saveConfiguration,
    generateLink,
    
    // Modal actions
    openErrorModal,
    closeErrorModal,
    openQRModal,
    closeQRModal,
    
    // Demographic question actions
    setDemographicQuestionsEnabled,
    updateDemographicQuestion,
    
    // Link config actions
    setLinkConfigEnabled,
    updateLinkConfig,
    
    // Parameter options actions
    updateParameterOptions,
    
    // Quota management
    addQuota,
    updateQuota,
    deleteQuota,
    
    // Utility functions
    checkRequiredFields: state.checkRequiredFields,
    generateRecruitmentLink: state.generateRecruitmentLink,
  };
}