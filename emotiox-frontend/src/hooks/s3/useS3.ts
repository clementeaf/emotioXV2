import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/query-client';
import s3 from '../../api/domains/s3/s3.api';
import type { S3UploadResponse, ApiResponse } from '../../types/api.types';

export const useS3Upload = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post<ApiResponse<S3UploadResponse>>(
        s3.upload(),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    },
    onMutate: async (file) => {
      // Para S3, la carga optimista es más compleja ya que involucra archivos
      // Simulamos un estado de "uploading" en lugar de datos optimistas
      const optimisticResponse: ApiResponse<S3UploadResponse> = {
        success: true,
        data: {
          key: `temp-${Date.now()}-${file.name}`,
          url: URL.createObjectURL(file),
          bucket: 'temp-bucket',
          size: file.size,
          // type: file.type, // Propiedad no existe en S3UploadResponse
          // uploadedAt: new Date().toISOString() // Propiedad no existe en S3UploadResponse
        }
      };
      
      return { optimisticResponse };
    },
    onSuccess: (_data) => {
      // Invalidar cualquier cache relacionado con archivos
      queryClient.invalidateQueries({ queryKey: ['s3'] });
    },
    onError: (_err, _file, context) => {
      // Limpiar URL temporal si existe
      if (context?.optimisticResponse?.data?.url) {
        URL.revokeObjectURL(context.optimisticResponse.data.url);
      }
    },
  });
};

export const useS3Download = () => {
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await axiosInstance.post<ApiResponse<{ url: string }>>(
        s3.download(),
        { key }
      );
      return response.data;
    },
  });
};

export const useS3DeleteObject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (key: string) => {
      const response = await axiosInstance.delete<ApiResponse<void>>(
        s3.deleteObject(),
        { data: { key } }
      );
      return response.data;
    },
    onMutate: async (key) => {
      // Para S3 delete, invalidamos inmediatamente el cache
      queryClient.invalidateQueries({ queryKey: ['s3'] });
      queryClient.invalidateQueries({ queryKey: ['s3', key] });
    },
    onSuccess: () => {
      // Confirmar invalidación después del éxito
      queryClient.invalidateQueries({ queryKey: ['s3'] });
    },
  });
};
