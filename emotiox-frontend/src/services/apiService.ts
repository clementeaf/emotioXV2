/**
 * API Service
 * Centralized API service using environment configuration
 */

import { env, getApiUrl } from '../config';
import type { ApiConfig } from '../config/env';

// API Response types
export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

// API Service class
export class ApiService {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetries: number;

  constructor(config: ApiConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultTimeout = config.timeout;
    this.defaultRetries = config.retries;
  }

  /**
   * Make HTTP request with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
    } = config;

    const url = getApiUrl(endpoint);
    const requestHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          data,
          success: true,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Request failed after ${retries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...config, method: 'PATCH', body: data });
  }

  /**
   * Upload file
   */
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'method' | 'body'>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const url = getApiUrl(endpoint);
    const { timeout = this.defaultTimeout, retries = this.defaultRetries } = config || {};

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return {
          data,
          success: true,
        };
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Upload failed after ${retries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get full URL for endpoint
   */
  getUrl(endpoint: string): string {
    return getApiUrl(endpoint);
  }
}

// Create singleton instance
export const apiService = new ApiService(env.api);

// Export convenience functions
export const api = {
  get: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiService.get<T>(endpoint, config),
  
  post: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiService.post<T>(endpoint, data, config),
  
  put: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiService.put<T>(endpoint, data, config),
  
  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiService.delete<T>(endpoint, config),
  
  patch: <T>(endpoint: string, data?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiService.patch<T>(endpoint, data, config),
  
  uploadFile: <T>(endpoint: string, file: File, additionalData?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiService.uploadFile<T>(endpoint, file, additionalData, config),
  
  getUrl: (endpoint: string) => apiService.getUrl(endpoint),
  getBaseUrl: () => apiService.getBaseUrl(),
};
