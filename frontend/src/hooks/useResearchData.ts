/**
 * 🎯 RESEARCH DATA HOOK - AlovaJS Clean Implementation
 * Follows SOLID, DRY, KISS principles with strict TypeScript
 * Max 200 lines, single responsibility
 */

import { useRequest } from 'alova/client';
import { researchMethods, researchDataMethods } from '../services/research.methods';
import { 
  processSmartVOCData, 
  processCPVData, 
  processTrustFlowData 
} from '../utils/data.processors';
import type {
  Research,
  GroupedResponsesResponse,
  QuestionWithResponses,
  SmartVOCFormData,
  SmartVOCResults,
  CPVData,
  TrustFlowData,
  ApiResponse
} from '../types/research';

interface UseResearchDataParams {
  researchId: string;
}

interface UseResearchDataReturn {
  // Core data
  researchData: Research | null;
  smartVOCFormData: SmartVOCFormData | null;
  groupedResponses: GroupedResponsesResponse | null;
  
  // Processed data
  smartVOCResults: SmartVOCResults | null;
  cpvData: CPVData | null;
  trustFlowData: TrustFlowData[];
  
  // Loading states
  isResearchLoading: boolean;
  isSmartVOCFormLoading: boolean;
  isGroupedResponsesLoading: boolean;
  
  // Error states
  researchError: Error | null;
  smartVOCFormError: Error | null;
  groupedResponsesError: Error | null;
  
  // Actions
  refetchResearch: () => Promise<ApiResponse<Research>>;
  refetchSmartVOCForm: () => Promise<ApiResponse<SmartVOCFormData>>;
  refetchGroupedResponses: () => Promise<GroupedResponsesResponse>;
}

/**
 * Centralized hook for all research data operations
 * Uses AlovaJS for caching and state management
 */
export function useResearchData({ researchId }: UseResearchDataParams): UseResearchDataReturn {
  // Validate research ID
  if (!researchId || typeof researchId !== 'string' || researchId.trim() === '') {
    throw new Error('Valid research ID is required');
  }

  // Core research data
  const researchQuery = useRequest(
    () => researchMethods.getById(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  // SmartVOC form data
  const smartVOCFormQuery = useRequest(
    () => researchDataMethods.getSmartVOCForm(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  // Grouped responses data
  const groupedResponsesQuery = useRequest(
    () => researchDataMethods.getGroupedResponses(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  // Process data when available  
  const processedData = useProcessedData({
    researchId: researchId || '',
    questions: (groupedResponsesQuery.data as { questions?: QuestionWithResponses[] })?.questions || [],
    data: (groupedResponsesQuery.data as { questions?: QuestionWithResponses[] })?.questions || [],
    total: 0,
    participantCount: 0
  });

  return {
    // Core data
    researchData: researchQuery.data?.data || null,
    smartVOCFormData: smartVOCFormQuery.data?.data || null,
    groupedResponses: {
      researchId: researchId || '',
      questions: (groupedResponsesQuery.data as { questions?: QuestionWithResponses[] })?.questions || [] as QuestionWithResponses[],
      data: (groupedResponsesQuery.data as { questions?: QuestionWithResponses[] })?.questions || [] as QuestionWithResponses[],
      total: 0,
      participantCount: 0
    },
    
    // Processed data
    smartVOCResults: processedData.smartVOCResults,
    cpvData: processedData.cpvData,
    trustFlowData: processedData.trustFlowData,
    
    // Loading states
    isResearchLoading: researchQuery.loading,
    isSmartVOCFormLoading: smartVOCFormQuery.loading,
    isGroupedResponsesLoading: groupedResponsesQuery.loading,
    
    // Error states
    researchError: researchQuery.error || null,
    smartVOCFormError: smartVOCFormQuery.error || null,
    groupedResponsesError: groupedResponsesQuery.error || null,
    
    // Actions
    refetchResearch: async () => {
      const response = await researchQuery.send();
      return { data: response.data, success: true };
    },
    refetchSmartVOCForm: async () => {
      const response = await smartVOCFormQuery.send();
      return { data: response.data, success: true };
    },
    refetchGroupedResponses: async () => {
      const response = await groupedResponsesQuery.send();
      return {
        researchId: researchId || '',
        questions: (response as { questions?: QuestionWithResponses[] })?.questions || [],
        data: (response as { questions?: QuestionWithResponses[] })?.questions || [],
        total: 0,
        participantCount: 0
      };
    },
  };
}

/**
 * Process grouped responses into derived data
 */
function useProcessedData(groupedResponses: GroupedResponsesResponse | null) {
  if (!groupedResponses?.data || !Array.isArray(groupedResponses.data)) {
    return {
      smartVOCResults: null,
      cpvData: null,
      trustFlowData: []
    };
  }

  try {
    const smartVOCResults = processSmartVOCData(groupedResponses.data);
    const cpvData = processCPVData(groupedResponses.data);
    const trustFlowData = processTrustFlowData(groupedResponses.data);

    return {
      smartVOCResults,
      cpvData,
      trustFlowData
    };
  } catch (error) {
    console.error('Error processing research data:', error);
    return {
      smartVOCResults: null,
      cpvData: null,
      trustFlowData: []
    };
  }
}

/**
 * Simplified hook for basic research data only
 */
export function useBasicResearchData(researchId: string) {
  if (!researchId) {
    throw new Error('Research ID is required');
  }

  const query = useRequest(
    () => researchMethods.getById(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  return {
    data: query.data?.data || null,
    loading: query.loading,
    error: query.error || null,
    refetch: query.send
  };
}

/**
 * Hook for SmartVOC form data only
 */
export function useSmartVOCFormData(researchId: string) {
  if (!researchId) {
    throw new Error('Research ID is required');
  }

  const query = useRequest(
    () => researchDataMethods.getSmartVOCForm(researchId),
    {
      initialData: undefined,
      immediate: true,
    }
  );

  return {
    data: query.data?.data || null,
    loading: query.loading,
    error: query.error || null,
    refetch: query.send
  };
}