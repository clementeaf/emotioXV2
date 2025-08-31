/**
 * Eye tracking service methods for API operations
 */

import { alovaInstance } from '@/config/alova.config';
import type { EyeTrackingData, EyeTrackingFormData } from '@/types/eye-tracking';

/**
 * Fetch eye tracking data
 */
export const fetchEyeTrackingData = (researchId: string) =>
  alovaInstance.Get<{ data: EyeTrackingData }>(`/eye-tracking/${researchId}`, {
    name: 'fetchEyeTrackingData'
  });

/**
 * Create eye tracking configuration
 */
export const createEyeTrackingConfig = (configData: EyeTrackingFormData) =>
  alovaInstance.Post<{ data: EyeTrackingData }>('/eye-tracking', configData, {
    name: 'createEyeTrackingConfig'
  });

/**
 * Update eye tracking configuration
 */
export const updateEyeTrackingConfig = (id: string, configData: Partial<EyeTrackingFormData>) =>
  alovaInstance.Put<{ data: EyeTrackingData }>(`/eye-tracking/${id}`, configData, {
    name: 'updateEyeTrackingConfig'
  });

/**
 * Get eye tracking results
 */
export const getEyeTrackingResults = (researchId: string) =>
  alovaInstance.Get<{ data: any }>(`/eye-tracking/${researchId}/results`, {
    name: 'getEyeTrackingResults'
  });

/**
 * Upload eye tracking stimuli
 */
export const uploadStimuliFiles = (files: File[]) =>
  alovaInstance.Post<{ data: { urls: string[] } }>('/eye-tracking/upload-stimuli', 
    { files }, 
    {
      name: 'uploadStimuliFiles'
    }
  );

/**
 * Get eye tracking by research ID
 */
export const getByResearchId = (researchId: string) =>
  alovaInstance.Get(`/eye-tracking/build/${researchId}`, {
    name: 'getByResearchId'
  });

/**
 * Eye tracking build methods
 */
export const eyeTrackingBuildMethods = {
  create: createEyeTrackingConfig,
  update: updateEyeTrackingConfig,
  fetch: fetchEyeTrackingData,
  upload: uploadStimuliFiles,
  getByResearchId
};

/**
 * Eye tracking recruit methods
 */
export const eyeTrackingRecruitMethods = {
  fetch: fetchEyeTrackingData,
  update: updateEyeTrackingConfig,
  getByResearchId
};

/**
 * Get results by research ID
 */
export const getResults = (researchId: string) =>
  alovaInstance.Get(`/eye-tracking/results/${researchId}`, {
    name: 'getResults'
  });

/**
 * Get participant results
 */
export const getParticipantResults = (researchId: string, participantId: string) =>
  alovaInstance.Get(`/eye-tracking/results/${researchId}/participant/${participantId}`, {
    name: 'getParticipantResults'
  });

/**
 * Eye tracking results methods
 */
export const eyeTrackingResultsMethods = {
  fetch: getEyeTrackingResults,
  fetchData: fetchEyeTrackingData,
  getResults,
  getParticipantResults
};