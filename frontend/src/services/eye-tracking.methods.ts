/**
 * Eye tracking service methods for API operations
 */

import { createAlova } from '@/config/api-alova';
import type { EyeTrackingData, EyeTrackingFormData } from '@/types/eye-tracking';

const alova = createAlova();

/**
 * Fetch eye tracking data
 */
export const fetchEyeTrackingData = (researchId: string) =>
  alova.Get<{ data: EyeTrackingData }>(`/eye-tracking/${researchId}`, {
    name: 'fetchEyeTrackingData'
  });

/**
 * Create eye tracking configuration
 */
export const createEyeTrackingConfig = (configData: EyeTrackingFormData) =>
  alova.Post<{ data: EyeTrackingData }>('/eye-tracking', configData, {
    name: 'createEyeTrackingConfig'
  });

/**
 * Update eye tracking configuration
 */
export const updateEyeTrackingConfig = (id: string, configData: Partial<EyeTrackingFormData>) =>
  alova.Put<{ data: EyeTrackingData }>(`/eye-tracking/${id}`, configData, {
    name: 'updateEyeTrackingConfig'
  });

/**
 * Get eye tracking results
 */
export const getEyeTrackingResults = (researchId: string) =>
  alova.Get<{ data: any }>(`/eye-tracking/${researchId}/results`, {
    name: 'getEyeTrackingResults'
  });

/**
 * Upload eye tracking stimuli
 */
export const uploadStimuliFiles = (files: File[]) =>
  alova.Post<{ data: { urls: string[] } }>('/eye-tracking/upload-stimuli', 
    { files }, 
    {
      name: 'uploadStimuliFiles'
    }
  );

/**
 * Get eye tracking by research ID
 */
export const getByResearchId = (researchId: string) =>
  alova.Get(`/eye-tracking/build/${researchId}`, {
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
  alova.Get(`/eye-tracking/results/${researchId}`, {
    name: 'getResults'
  });

/**
 * Get participant results
 */
export const getParticipantResults = (researchId: string, participantId: string) =>
  alova.Get(`/eye-tracking/results/${researchId}/participant/${participantId}`, {
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