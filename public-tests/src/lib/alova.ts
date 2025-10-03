import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_HTTP_ENDPOINT } from '../config/endpoints';

// Instancia de axios configurada
const axiosInstance = axios.create({
  baseURL: API_HTTP_ENDPOINT,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para logging de errores
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.error('[API] Error en request:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    // Mensajes de error personalizados
    if (error.code === 'ECONNABORTED') {
      throw new Error('La solicitud tardó demasiado en completarse');
    }

    if (error.response?.status === 404) {
      throw new Error('Recurso no encontrado');
    }

    if (error.response?.status === 500) {
      throw new Error('Error interno del servidor');
    }

    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      throw new Error('Error en la solicitud');
    }

    throw new Error('Error de conexión');
  }
);

// Función de request compatible con la firma anterior
const apiRequest = async <T>(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<T> => {
  const response = await axiosInstance.request<T>({
    url,
    ...options
  });
  return response.data;
};

export { axiosInstance as API_CONFIG, apiRequest };
