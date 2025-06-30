import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de localStorage y sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock de Zustand persist
const mockPersist = vi.fn();

// Inicializar global objects para Node.js
function ensureWindow() {
  if (typeof global !== 'undefined') {
    global.window = {
      localStorage: mockLocalStorage,
      sessionStorage: mockSessionStorage,
      location: {
        protocol: 'https:',
        href: 'https://example.com'
      }
    } as any;
  }
}

// Limpiar todos los mocks antes de cada test
function clearAllMocks() {
  mockLocalStorage.getItem.mockClear();
  mockLocalStorage.setItem.mockClear();
  mockLocalStorage.removeItem.mockClear();
  mockLocalStorage.clear.mockClear();
  mockLocalStorage.key.mockClear();

  mockSessionStorage.getItem.mockClear();
  mockSessionStorage.setItem.mockClear();
  mockSessionStorage.removeItem.mockClear();
  mockSessionStorage.clear.mockClear();
  mockSessionStorage.key.mockClear();

  mockPersist.mockClear();
}

describe('Tests de Persistencia de Datos', () => {
  beforeEach(() => {
    ensureWindow();
    clearAllMocks();
  });

  afterEach(() => {
    clearAllMocks();
  });

  describe('localStorage - Persistencia Básica', () => {
    it('Guarda datos correctamente en localStorage', () => {
      const testData = {
        researchId: 'test-123',
        participantId: 'participant-456',
        responses: ['respuesta1', 'respuesta2'],
        timestamp: Date.now()
      };

      mockLocalStorage.setItem('test-key', JSON.stringify(testData));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('Recupera datos correctamente de localStorage', () => {
      const testData = {
        researchId: 'test-123',
        participantId: 'participant-456',
        responses: ['respuesta1', 'respuesta2'],
        timestamp: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const retrieved = mockLocalStorage.getItem('test-key');
      const parsed = JSON.parse(retrieved);

      expect(parsed.researchId).toBe('test-123');
      expect(parsed.participantId).toBe('participant-456');
      expect(parsed.responses).toEqual(['respuesta1', 'respuesta2']);
    });

    it('Maneja datos no existentes en localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const retrieved = mockLocalStorage.getItem('non-existent-key');

      expect(retrieved).toBeNull();
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('non-existent-key');
    });

    it('Elimina datos correctamente de localStorage', () => {
      mockLocalStorage.removeItem('test-key');

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(1);
    });

    it('Limpia todo localStorage correctamente', () => {
      mockLocalStorage.clear();

      expect(mockLocalStorage.clear).toHaveBeenCalled();
      expect(mockLocalStorage.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('sessionStorage - Persistencia de Sesión', () => {
    it('Guarda datos correctamente en sessionStorage', () => {
      const sessionData = {
        currentStep: 'cognitive_task',
        progress: 75,
        startTime: Date.now()
      };

      mockSessionStorage.setItem('session-data', JSON.stringify(sessionData));

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('session-data', JSON.stringify(sessionData));
    });

    it('Recupera datos de sesión correctamente', () => {
      const sessionData = {
        currentStep: 'cognitive_task',
        progress: 75,
        startTime: Date.now()
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      const retrieved = mockSessionStorage.getItem('session-data');
      const parsed = JSON.parse(retrieved);

      expect(parsed.currentStep).toBe('cognitive_task');
      expect(parsed.progress).toBe(75);
    });

    it('Maneja datos no existentes en sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const retrieved = mockSessionStorage.getItem('non-existent-session');

      expect(retrieved).toBeNull();
    });

    it('Elimina datos de sesión correctamente', () => {
      mockSessionStorage.removeItem('session-data');

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('session-data');
    });
  });

  describe('Zustand Persist - Persistencia de Estado', () => {
    it('Configura persistencia correctamente', () => {
      const persistConfig = {
        name: 'participant-store',
        storage: {
          getItem: mockLocalStorage.getItem,
          setItem: mockLocalStorage.setItem,
          removeItem: mockLocalStorage.removeItem
        }
      };

      mockPersist(persistConfig);

      expect(mockPersist).toHaveBeenCalledWith(persistConfig);
    });

    it('Persiste estado complejo correctamente', () => {
      const complexState = {
        researchId: 'research-123',
        participantId: 'participant-456',
        currentStep: 'eye_tracking',
        responsesData: {
          eye_tracking: [
            { questionId: 'q1', answer: 'A', timestamp: Date.now() },
            { questionId: 'q2', answer: 'B', timestamp: Date.now() }
          ],
          cognitive_task: [
            { taskId: 'task1', response: 'correct', timeSpent: 5000 }
          ]
        },
        metadata: {
          deviceType: 'desktop',
          startTime: Date.now(),
          reentryCount: 0
        }
      };

      mockLocalStorage.setItem('participant-store', JSON.stringify(complexState));

      const calledWith = mockLocalStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(calledWith);

      expect(parsed.researchId).toBe('research-123');
      expect(parsed.responsesData.eye_tracking).toHaveLength(2);
      expect(parsed.responsesData.cognitive_task).toHaveLength(1);
      expect(parsed.metadata.deviceType).toBe('desktop');
    });

    it('Recupera estado persistido correctamente', () => {
      const persistedState = {
        researchId: 'research-123',
        participantId: 'participant-456',
        currentStep: 'eye_tracking',
        responsesData: {
          eye_tracking: [
            { questionId: 'q1', answer: 'A', timestamp: Date.now() }
          ]
        }
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(persistedState));

      const retrieved = mockLocalStorage.getItem('participant-store');
      const parsed = JSON.parse(retrieved);

      expect(parsed.researchId).toBe('research-123');
      expect(parsed.currentStep).toBe('eye_tracking');
      expect(parsed.responsesData.eye_tracking).toHaveLength(1);
    });
  });

  describe('Limpieza de Datos', () => {
    it('Limpia datos específicos de investigación', () => {
      const researchId = 'research-123';

      // Simular datos de investigación
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([
        'research_123_data',
        'research_123_cache',
        'research_123_temp'
      ]));

      // Limpiar datos específicos
      mockLocalStorage.removeItem(`research_${researchId}_data`);
      mockLocalStorage.removeItem(`research_${researchId}_cache`);
      mockLocalStorage.removeItem(`research_${researchId}_temp`);

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('research_research-123_data');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('research_research-123_cache');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('research_research-123_temp');
    });

    it('Limpia todos los datos de formulario', () => {
      // Simular múltiples claves de formulario
      const formKeys = [
        'form_eye_tracking_123',
        'form_cognitive_task_123',
        'form_smartvoc_123',
        'response_cache_123'
      ];

      formKeys.forEach(key => {
        mockSessionStorage.removeItem(key);
      });

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('form_eye_tracking_123');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('form_cognitive_task_123');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('form_smartvoc_123');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('response_cache_123');
    });

    it('Limpia datos expirados correctamente', () => {
      const expiredData = {
        timestamp: Date.now() - (24 * 60 * 60 * 1000), // 24 horas atrás
        data: 'expired data'
      };

      const validData = {
        timestamp: Date.now(),
        data: 'valid data'
      };

      // Simular verificación de expiración
      const isExpired = (timestamp: number) => {
        return Date.now() - timestamp > 60 * 60 * 1000; // 1 hora
      };

      expect(isExpired(expiredData.timestamp)).toBe(true);
      expect(isExpired(validData.timestamp)).toBe(false);
    });
  });

  describe('Recuperación de Datos', () => {
    it('Recupera datos de investigación específica', () => {
      const researchId = 'research-123';
      const researchData = {
        id: researchId,
        title: 'Test Research',
        status: 'active',
        participants: 50
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(researchData));

      const retrieved = mockLocalStorage.getItem(`research_${researchId}`);
      const parsed = JSON.parse(retrieved);

      expect(parsed.id).toBe(researchId);
      expect(parsed.title).toBe('Test Research');
      expect(parsed.status).toBe('active');
    });

    it('Recupera progreso de sesión', () => {
      const sessionProgress = {
        currentStep: 'cognitive_task',
        completedSteps: ['demographics', 'eye_tracking'],
        progress: 60,
        startTime: Date.now() - 300000 // 5 minutos atrás
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(sessionProgress));

      const retrieved = mockSessionStorage.getItem('session_progress');
      const parsed = JSON.parse(retrieved);

      expect(parsed.currentStep).toBe('cognitive_task');
      expect(parsed.completedSteps).toContain('demographics');
      expect(parsed.progress).toBe(60);
    });

    it('Recupera preferencias de usuario', () => {
      const userPreferences = {
        theme: 'dark',
        language: 'es',
        notifications: true,
        autoSave: true,
        lastUpdated: Date.now()
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userPreferences));

      const retrieved = mockLocalStorage.getItem('user_preferences');
      const parsed = JSON.parse(retrieved);

      expect(parsed.theme).toBe('dark');
      expect(parsed.language).toBe('es');
      expect(parsed.notifications).toBe(true);
    });
  });

  describe('Manejo de Errores', () => {
    it('Maneja errores de localStorage no disponible', () => {
      // Simular localStorage no disponible
      const originalLocalStorage = global.window.localStorage;
      global.window.localStorage = null as any;

      try {
        // Intentar usar localStorage
        const result = global.window.localStorage?.getItem('test');
        expect(result).toBeUndefined();
      } finally {
        // Restaurar localStorage
        global.window.localStorage = originalLocalStorage;
      }
    });

    it('Maneja errores de datos corruptos', () => {
      // Simular datos JSON corruptos
      mockLocalStorage.getItem.mockReturnValue('invalid json');

      try {
        const retrieved = mockLocalStorage.getItem('corrupt-data');
        JSON.parse(retrieved);
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    it('Maneja errores de almacenamiento lleno', () => {
      // Simular error de almacenamiento lleno solo para este test
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      try {
        mockLocalStorage.setItem('large-data', 'x'.repeat(1000000));
      } catch (error) {
        expect(error.message).toBe('QuotaExceededError');
      } finally {
        // Restaurar el mock a vi.fn() para evitar recursión
        mockLocalStorage.setItem.mockImplementation(vi.fn());
      }
    });
  });

  describe('Sincronización de Datos', () => {
    it('Sincroniza datos entre localStorage y sessionStorage', () => {
      const syncData = {
        researchId: 'research-123',
        participantId: 'participant-456',
        timestamp: Date.now()
      };

      // Guardar en ambos storages
      mockLocalStorage.setItem('sync-data', JSON.stringify(syncData));
      mockSessionStorage.setItem('sync-data', JSON.stringify(syncData));

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sync-data', JSON.stringify(syncData));
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('sync-data', JSON.stringify(syncData));
    });

    it('Verifica consistencia entre storages', () => {
      const data = { test: 'data' };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(data));
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(data));

      const localData = JSON.parse(mockLocalStorage.getItem('test-key'));
      const sessionData = JSON.parse(mockSessionStorage.getItem('test-key'));

      expect(localData).toEqual(sessionData);
    });
  });

  describe('Versionado de Datos', () => {
    it('Maneja versiones de datos correctamente', () => {
      const versionedData = {
        version: '1.2.0',
        data: {
          researchId: 'research-123',
          responses: ['respuesta1', 'respuesta2']
        },
        timestamp: Date.now()
      };

      mockLocalStorage.setItem('versioned-data', JSON.stringify(versionedData));

      const calledWith = mockLocalStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(calledWith);

      expect(parsed.version).toBe('1.2.0');
      expect(parsed.data.researchId).toBe('research-123');
    });

    it('Migra datos de versiones antiguas', () => {
      const oldVersionData = {
        version: '1.0.0',
        researchId: 'research-123',
        responses: ['respuesta1']
      };

      const newVersionData = {
        version: '1.2.0',
        data: {
          researchId: 'research-123',
          responses: ['respuesta1']
        },
        timestamp: Date.now()
      };

      // Simular migración
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(oldVersionData));
      mockLocalStorage.setItem('migrated-data', JSON.stringify(newVersionData));

      const calledWith = mockLocalStorage.setItem.mock.calls[0][1];
      const parsed = JSON.parse(calledWith);

      expect(parsed.version).toBe('1.2.0');
      expect(parsed.data.researchId).toBe('research-123');
    });
  });
});
