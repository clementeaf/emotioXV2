import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ApiClient } from '../lib/api';
import { APIResponse } from '../lib/types';

const apiClient = new ApiClient();

import { RawResearchModule } from '../types/hooks.types';

export interface ProcessedResearchFormConfig {
  id: string;        
  originalSk: string; 
  derivedType: string;
  config: RawResearchModule;
}

type TransformedData = ProcessedResearchFormConfig[];

export function useLoadResearchFormsConfig(
  researchId: string,
  options?: Omit<UseQueryOptions<APIResponse<TransformedData>, Error, APIResponse<TransformedData>, readonly ['researchFormsConfig', string]>, 'queryKey' | 'queryFn'>
) {
  return useQuery<APIResponse<TransformedData>, Error, APIResponse<TransformedData>, readonly ['researchFormsConfig', string]>({
    queryKey: ['researchFormsConfig', researchId] as const,
    queryFn: async () => {
      const apiResponse = await apiClient.getResearchFlow(researchId) as unknown as APIResponse<RawResearchModule[]>;

      if (apiResponse.error) {
        console.error("API explicitly returned an error:", apiResponse.error);
        return { ...apiResponse, data: [] as TransformedData };
      }

      if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
        console.error("API response data is missing, not an array, or invalid.");
        return {
          ...(apiResponse as Omit<APIResponse<unknown>, 'data' | 'error' | 'message'>),
          error: true,
          message: apiResponse.message || "Invalid data structure: data is missing or not an array.",
          data: [] as TransformedData,
        };
      }

      const rawModules: RawResearchModule[] = apiResponse.data;

      const processedModules: ProcessedResearchFormConfig[] = rawModules.map((module, index) => {
        const stepId = module.id || `${module.sk}_${index}_${Date.now()}`;
        const derivedType = module.sk.toLowerCase(); 

        return {
          id: stepId,
          originalSk: module.sk,
          derivedType: derivedType,
          config: module, 
        };
      });

      return {
        ...apiResponse,
        data: processedModules,
      };
    },
    enabled: !!researchId,
    ...options,
  });
}
