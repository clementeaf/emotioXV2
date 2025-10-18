import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiService, api } from '../apiService';

// Mock the config module
vi.mock('../../config', () => ({
  env: {
    api: {
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
      retries: 2,
    },
  },
  getApiUrl: vi.fn((path: string) => `http://localhost:3000${path}`),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortController
const mockAbortController = {
  abort: vi.fn(),
  signal: {},
};
global.AbortController = vi.fn(() => mockAbortController) as any;

// Mock setTimeout and clearTimeout
vi.stubGlobal('setTimeout', vi.fn((fn) => {
  fn();
  return 123;
}));
vi.stubGlobal('clearTimeout', vi.fn());

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    vi.clearAllMocks();
    apiService = new ApiService({
      baseUrl: 'http://localhost:3000',
      timeout: 5000,
      retries: 2,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET requests', () => {
    it('makes successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({
        data: mockResponse,
        success: true,
      });
    });

    it('handles GET request with custom headers', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiService.get('/test', {
        headers: { 'Authorization': 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
          },
        })
      );
    });
  });

  describe('POST requests', () => {
    it('makes successful POST request with data', async () => {
      const mockResponse = { id: 1 };
      const requestData = { name: 'test' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.post('/users', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual({
        data: mockResponse,
        success: true,
      });
    });
  });

  describe('PUT requests', () => {
    it('makes successful PUT request', async () => {
      const mockResponse = { updated: true };
      const requestData = { name: 'updated' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.put('/users/1', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(requestData),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('DELETE requests', () => {
    it('makes successful DELETE request', async () => {
      const mockResponse = { deleted: true };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('PATCH requests', () => {
    it('makes successful PATCH request', async () => {
      const mockResponse = { patched: true };
      const requestData = { name: 'patched' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.patch('/users/1', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe('File upload', () => {
    it('uploads file successfully', async () => {
      const mockResponse = { url: 'https://example.com/file.jpg' };
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiService.uploadFile('/upload', file);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result.success).toBe(true);
    });

    it('uploads file with additional data', async () => {
      const mockResponse = { url: 'https://example.com/file.jpg' };
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const additionalData = { category: 'avatar' };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await apiService.uploadFile('/upload', file, additionalData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/upload',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(apiService.get('/nonexistent')).rejects.toThrow('HTTP 404: Not Found');
    });

    it('handles network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Request failed after 3 attempts: Network error');
    });

    it('retries on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      const result = await apiService.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('fails after max retries', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(apiService.get('/test')).rejects.toThrow('Request failed after 3 attempts: Network error');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Timeout handling', () => {
    it('handles request timeout', async () => {
      const mockAbort = vi.fn();
      mockAbortController.abort = mockAbort;
      
      mockFetch.mockImplementation(() => {
        throw new Error('AbortError');
      });

      await expect(apiService.get('/test')).rejects.toThrow();
    });
  });

  describe('Utility methods', () => {
    it('returns base URL', () => {
      expect(apiService.getBaseUrl()).toBe('http://localhost:3000');
    });

    it('returns full URL for endpoint', () => {
      expect(apiService.getUrl('/test')).toBe('http://localhost:3000/test');
    });
  });

  describe('API convenience functions', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });
    });

    it('provides convenience GET function', async () => {
      await api.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('provides convenience POST function', async () => {
      await api.post('/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('provides convenience PUT function', async () => {
      await api.put('/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('provides convenience DELETE function', async () => {
      await api.delete('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('provides convenience PATCH function', async () => {
      await api.patch('/test', { data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/test',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('provides convenience upload function', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      await api.uploadFile('/upload', file);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/upload',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('provides URL utility functions', () => {
      expect(api.getUrl('/test')).toBe('http://localhost:3000/test');
      expect(api.getBaseUrl()).toBe('http://localhost:3000');
    });
  });
});
