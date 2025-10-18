import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import admin from '../../api/domains/admin/admin.api';
import type { AdminStats, ApiResponse } from '../../types/api.types';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<AdminStats>>(
        admin.stats()
      );
      return response.data;
    },
  });
};
