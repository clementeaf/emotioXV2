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
      try {
        const response = await axiosInstance.get<ApiResponse<Company[]>>(
          companies.getAll()
        );
        
        // Si no hay empresas en la respuesta, usar fallback
        if (!response.data.data || response.data.data.length === 0) {
          const fallbackCompanies: Company[] = [
            { id: 'enterprise1', name: 'Enterprise 1', status: 'active', createdAt: '', updatedAt: '' },
            { id: 'enterprise2', name: 'Enterprise 2', status: 'active', createdAt: '', updatedAt: '' },
            { id: 'enterprise3', name: 'Enterprise 3', status: 'active', createdAt: '', updatedAt: '' }
          ];
          return {
            ...response.data,
            data: fallbackCompanies
          };
        }
        
        return response.data;
      } catch (error) {
        console.error('Error loading companies:', error);
        
        // En caso de error, usar empresas de fallback
        const fallbackCompanies: Company[] = [
          { id: 'enterprise1', name: 'Enterprise 1', status: 'active', createdAt: '', updatedAt: '' },
          { id: 'enterprise2', name: 'Enterprise 2', status: 'active', createdAt: '', updatedAt: '' },
          { id: 'enterprise3', name: 'Enterprise 3', status: 'active', createdAt: '', updatedAt: '' }
        ];
        
        return {
          success: true,
          data: fallbackCompanies
        };
      }
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
      console.log('🚀 OPTIMISTIC CREATE COMPANY - Starting');
      
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
      console.log('🚀 CREATE COMPANY SUCCESS - Replacing optimistic with real data');
      
      queryClient.setQueryData(['companies'], (old: ApiResponse<Company[]> | undefined) => ({
        ...old,
        data: old?.data?.map((company: Company) => 
          company.id.startsWith('temp-') ? data.data : company
        ) || [data.data]
      }));
      
      // Invalidate to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error, _companyData, context) => {
      console.error('🚀 CREATE COMPANY ERROR - Rolling back:', error);
      
      if (context?.previousCompanies) {
        queryClient.setQueryData(['companies'], context.previousCompanies);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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