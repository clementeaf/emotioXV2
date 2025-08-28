import { useState, useCallback } from 'react';
import { EyeTrackingRecruitStats } from 'shared/interfaces/eyeTrackingRecruit.interface';
import { EyeTrackingRecruitFormData } from '../types/formData.types';
import { createInitialFormData } from '../utils/formHelpers';

export interface ErrorModalData {
  title: string;
  message: string | React.ReactNode;
  type: 'error' | 'info' | 'success' | 'warning';
}

export function useEyeTrackingRecruitState(researchId: string) {
  // Form data state
  const [formData, setFormData] = useState<EyeTrackingRecruitFormData>(
    createInitialFormData(researchId === 'current' ? '1234' : researchId)
  );

  // Stats state
  const [stats, setStats] = useState<EyeTrackingRecruitStats | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI states
  const [demographicQuestionsEnabled, setDemographicQuestionsEnabledState] = useState(true);
  const [linkConfigEnabled, setLinkConfigEnabledState] = useState(true);

  // Modal states
  const [modalError, setModalError] = useState<ErrorModalData | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [apiErrors, setApiErrors] = useState<{ 
    visible: boolean; 
    title: string; 
    message: string;
  } | undefined>(undefined);

  // QR Code states
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState<boolean>(false);

  // Helper functions
  const generateRecruitmentLink = useCallback(() => {
    const actualResearchId = researchId === 'current' ? '1234' : researchId;
    const publicTestsBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_TESTS_URL || 'https://useremotion.com';
    return `${publicTestsBaseUrl}/link/${actualResearchId}`;
  }, [researchId]);

  const checkRequiredFields = useCallback(() => {
    const errors: string[] = [];

    if (!formData.researchUrl) {
      errors.push('URL de investigación es requerida');
    }

    Object.entries(formData.demographicQuestions).forEach(([key, value]) => {
      if (value.enabled && value.required) {
        // Additional validation logic can be added here
      }
    });

    return errors.length === 0;
  }, [formData]);

  return {
    // States
    formData,
    setFormData,
    stats,
    setStats,
    loading,
    setLoading,
    saving,
    setSaving,
    demographicQuestionsEnabled,
    setDemographicQuestionsEnabledState,
    linkConfigEnabled,
    setLinkConfigEnabledState,
    modalError,
    setModalError,
    modalVisible,
    setModalVisible,
    apiErrors,
    setApiErrors,
    qrCodeData,
    setQrCodeData,
    showQRModal,
    setShowQRModal,
    
    // Helper functions
    generateRecruitmentLink,
    checkRequiredFields,
  };
}