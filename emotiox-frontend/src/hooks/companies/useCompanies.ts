import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import companies from '../../api/domains/companies/companies.api';
import type { Company, ApiResponse } from '../../types/api.types';

/**
 * Hook to fetch all companies
 */
export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Company[]>>(
        companies.getAll()
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to fetch a single company
 */
export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<Company>>(
        companies.getById(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (companyData: { name: string; status?: 'active' | 'inactive' }) => {
      const response = await axiosInstance.post<ApiResponse<Company>>(
        companies.create(),
        companyData
      );
      return response.data;
    },
    onMutate: async (companyData) => {
      await queryClient.cancelQueries({ queryKey: ['companies'] });
      const previousCompanies = queryClient.getQueryData(['companies']);
      
      const optimisticCompany: Company = {
        id: `temp-${Date.now()}`,
        name: companyData.name,
        status: (companyData.status as 'active' | 'inactive') || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      queryClient.setQueryData(['companies'], (old: ApiResponse<Company[]> | undefined) => ({
        ...old,
        data: [...(old?.data || []), optimisticCompany]
      }));
      
      return { previousCompanies };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['companies'], (old: ApiResponse<Company[]> | undefined) => ({
        ...old,
        data: old?.data?.map((company: Company) => 
          company.id.startsWith('temp-') ? data.data : company
        ) || [data.data]
      }));
    },
    onError: (_err, _companyData, context) => {
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies);
      }
    },
  });
};

/**
 * Hook to update a company
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Company> }) => {
      const response = await axiosInstance.put<ApiResponse<Company>>(
        companies.update(id),
        data
      );
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['companies'], (old: ApiResponse<Company[]> | undefined) => ({
        ...old,
        data: old?.data?.map((company: Company) => 
          company.id === data.data.id ? data.data : company
        ) || []
      }));
    },
  });
};

/**
 * Hook to delete a company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(companies.delete(id));
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData(['companies'], (old: ApiResponse<Company[]> | undefined) => ({
        ...old,
        data: old?.data?.filter((company: Company) => company.id !== id) || []
      }));
    },
  });
};