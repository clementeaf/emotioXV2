/**
 * 👁️ EYE TRACKING DATA HOOK - AlovaJS Clean Implementation
 * Centralized eye tracking data management with strict typing
 */

import { useRequest } from 'alova/client';
import { 
  eyeTrackingBuildMethods, 
  eyeTrackingRecruitMethods,
  eyeTrackingResultsMethods 
} from '../services/eye-tracking.methods';
import type {
  EyeTrackingBuildConfig,
  EyeTrackingRecruitConfig,
  EyeTrackingResults,
  UseEyeTrackingDataOptions,
  UseEyeTrackingDataReturn,
  EyeTrackingData
} from '../types/eye-tracking';
import type { EyeTrackingFormData } from '../../../shared/interfaces/eye-tracking.interface';
import type { ApiResponse } from '../types/research';

/**
 * Hook for eye tracking data (build and recruit configurations)
 */
export function useEyeTrackingData(
  researchId: string,
  options: UseEyeTrackingDataOptions = {}
): UseEyeTrackingDataReturn {
  if (!researchId) {
    throw new Error('Research ID is required for eye tracking data');
  }

  const { enabled = true, type = 'both' } = options;

  // Build configuration query
  const buildQuery = useRequest(
    () => eyeTrackingBuildMethods.getByResearchId(researchId),
    {
      initialData: undefined,
      immediate: enabled && (type === 'build' || type === 'both'),
    }
  );

  // Recruit configuration query
  const recruitQuery = useRequest(
    () => eyeTrackingRecruitMethods.getByResearchId(researchId),
    {
      initialData: undefined,
      immediate: enabled && (type === 'recruit' || type === 'both'),
    }
  );

  // Process combined data
  const combinedData = useCombinedEyeTrackingData(
    buildQuery.data?.data,
    recruitQuery.data?.data,
    type
  );

  const handleRefetch = async (): Promise<void> => {
    try {
      if (type === 'build' || type === 'both') {
        await buildQuery.send();
      }
      if (type === 'recruit' || type === 'both') {
        await recruitQuery.send();
      }
    } catch (error) {
      console.error('Failed to refetch eye tracking data:', error);
      throw error;
    }
  };

  const handleRefetchBuild = async (): Promise<void> => {
    try {
      await buildQuery.send();
    } catch (error) {
      console.error('Failed to refetch build config:', error);
      throw error;
    }
  };

  const handleRefetchRecruit = async (): Promise<void> => {
    try {
      await recruitQuery.send();
    } catch (error) {
      console.error('Failed to refetch recruit config:', error);
      throw error;
    }
  };

  return {
    data: combinedData || undefined,
    isLoading: buildQuery.loading || recruitQuery.loading,
    isLoadingBuild: buildQuery.loading,
    isLoadingRecruit: recruitQuery.loading,
    error: buildQuery.error || recruitQuery.error || null,
    refreshData: handleRefetch,
  };
}

/**
 * Hook for eye tracking build configuration only
 */
export function useEyeTrackingBuildData(researchId: string) {
  return useEyeTrackingData(researchId, { type: 'build' });
}

/**
 * Hook for eye tracking recruit configuration only
 */
export function useEyeTrackingRecruitData(researchId: string) {
  return useEyeTrackingData(researchId, { type: 'recruit' });
}

/**
 * Hook for eye tracking results
 */
export function useEyeTrackingResults(researchId: string) {
  if (!researchId) {
    throw new Error('Research ID is required for eye tracking results');
  }

  const query = useRequest(
    () => eyeTrackingResultsMethods.getResults(researchId),
    {
      initialData: [],
      immediate: true,
    }
  );

  return {
    results: query.data?.data || [],
    isLoading: query.loading,
    error: query.error || null,
    refetch: query.send,
  };
}

/**
 * Hook for specific participant eye tracking results
 */
export function useParticipantEyeTrackingResults(researchId: string, participantId: string) {
  if (!researchId || !participantId) {
    throw new Error('Research ID and Participant ID are required');
  }

  const query = useRequest(
    () => eyeTrackingResultsMethods.getParticipantResults(researchId, participantId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  return {
    results: query.data?.data || null,
    isLoading: query.loading,
    error: query.error || null,
    refetch: query.send,
  };
}

// Helper functions
function useCombinedEyeTrackingData(
  buildData: EyeTrackingBuildConfig | null | undefined,
  recruitData: EyeTrackingRecruitConfig | null | undefined,
  type: UseEyeTrackingDataOptions['type']
): EyeTrackingData | null {
  if (type === 'build') {
    return buildData ? {
      id: `build-${Date.now()}`,
      researchId: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      build: buildData
    } : null;
  }

  if (type === 'recruit') {
    return recruitData ? {
      id: `recruit-${Date.now()}`,
      researchId: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      recruit: recruitData
    } : null;
  }

  // type === 'both'
  if (!buildData && !recruitData) {
    return null;
  }

  const result: EyeTrackingData = {
    id: `combined-${Date.now()}`,
    researchId: 'unknown',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (buildData) result.build = buildData;
  if (recruitData) result.recruit = recruitData;

  return result;
}

/**
 * Utility function to validate eye tracking configuration
 */
export function validateEyeTrackingBuildConfig(
  config: Partial<EyeTrackingBuildConfig>
): boolean {
  const formData = config as EyeTrackingFormData;
  if (!formData.researchId || formData.researchId.trim().length === 0) {
    return false;
  }

  // Check required properties from EyeTrackingFormData
  if (!formData.config) {
    return false;
  }

  if (!formData.stimuli) {
    return false;
  }

  return true;
}

/**
 * Utility function to validate recruit configuration
 */
export function validateEyeTrackingRecruitConfig(
  config: Partial<EyeTrackingRecruitConfig>
): boolean {
  const recruitData = config as EyeTrackingFormData;
  if (!recruitData.researchId || recruitData.researchId.trim().length === 0) {
    return false;
  }

  // For now, just check basic structure since recruit config structure may vary
  return Boolean(config);
}