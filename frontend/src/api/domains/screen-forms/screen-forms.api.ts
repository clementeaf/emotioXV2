/**
 * Screen Forms Domain API
 * API methods for welcome screen and thank you screen functionality
 */

import { apiClient } from '@/api/config/axios';
import type {
  ThankYouScreenModel,
  CreateScreenFormRequest,
  UpdateScreenFormRequest,
  ValidationResponse,
  ApiResponse
} from './screen-forms.types';

/**
 * Screen Forms API methods
 * Handles both welcome screen and thank you screen
 * Backend distinguishes by questionKey and endpoint
 */
export const screenFormsApi = {
  /**
   * Get screen form by research ID and type
   */
  getByResearchId: async (researchId: string, screenType: 'welcome' | 'thankyou' = 'thankyou'): Promise<ThankYouScreenModel | null> => {
    try {
      const endpoint = screenType === 'welcome' ? 'welcome-screen' : 'thank-you-screen';
      const response = await apiClient.get<ApiResponse<ThankYouScreenModel>>(`/research/${researchId}/${endpoint}`);
      return response.data.data || response.data || null;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create screen form
   */
  create: async (data: CreateScreenFormRequest, screenType: 'welcome' | 'thankyou' = 'thankyou'): Promise<ThankYouScreenModel> => {
    const endpoint = screenType === 'welcome' ? 'welcome-screen' : 'thank-you-screen';
    const response = await apiClient.post<ApiResponse<ThankYouScreenModel>>(
      `/research/${data.researchId}/${endpoint}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Update screen form
   */
  update: async (researchId: string, data: UpdateScreenFormRequest, screenType: 'welcome' | 'thankyou' = 'thankyou'): Promise<ThankYouScreenModel> => {
    const endpoint = screenType === 'welcome' ? 'welcome-screen' : 'thank-you-screen';
    const response = await apiClient.put<ApiResponse<ThankYouScreenModel>>(
      `/research/${researchId}/${endpoint}`,
      data
    );
    return response.data.data || response.data;
  },

  /**
   * Delete screen form
   */
  delete: async (researchId: string, screenType: 'welcome' | 'thankyou' = 'thankyou'): Promise<void> => {
    const endpoint = screenType === 'welcome' ? 'welcome-screen' : 'thank-you-screen';
    await apiClient.delete(`/research/${researchId}/${endpoint}`);
  },

  /**
   * Validate screen form configuration
   */
  validate: async (researchId: string, screenType: 'welcome' | 'thankyou' = 'thankyou'): Promise<ValidationResponse> => {
    const endpoint = screenType === 'welcome' ? 'welcome-screen' : 'thank-you-screen';
    const response = await apiClient.get<ValidationResponse>(`/research/${researchId}/${endpoint}/validate`);
    return response.data;
  }
};
