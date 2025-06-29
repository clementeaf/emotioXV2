import { act, renderHook } from '@testing-library/react';
import { useStepTimeout } from '../useStepTimeout';

// Mock de Date.now para controlar el tiempo
const mockDateNow = jest.fn();
const originalDateNow = Date.now;

beforeAll(() => {
  Date.now = mockDateNow;
});

afterAll(() => {
  Date.now = originalDateNow;
});

describe('useStepTimeout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDateNow.mockReturnValue(1000000); // Tiempo base
  });

  it('debe inicializar con configuración correcta', () => {
    const config = {
      enabled: true,
      duration: 60,
      warningThreshold: 20,
      autoSubmit: false,
      showWarning: true
    };

    const { result } = renderHook(() => useStepTimeout(config));

    expect(result.current.isActive).toBe(false);
    expect(result.current.timeRemaining).toBe(60);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('debe iniciar timeout correctamente', () => {
    const config = {
      enabled: true,
      duration: 30,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.timeRemaining).toBe(30);
    expect(result.current.progress).toBe(100);
  });

  it('no debe iniciar timeout si no está habilitado', () => {
    const config = {
      enabled: false,
      duration: 30,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    expect(result.current.isActive).toBe(false);
  });

  it('debe actualizar tiempo restante correctamente', () => {
    const config = {
      enabled: true,
      duration: 10,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo
    mockDateNow.mockReturnValue(1000000 + 3000); // +3 segundos

    act(() => {
      // Forzar actualización
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeRemaining).toBe(7);
    expect(result.current.progress).toBe(70);
  });

  it('debe mostrar advertencia cuando se alcanza el umbral', () => {
    const config = {
      enabled: true,
      duration: 10,
      warningThreshold: 30, // 30% = 3 segundos
      autoSubmit: false
    };

    const onWarning = jest.fn();
    const { result } = renderHook(() => useStepTimeout(config, undefined, onWarning));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo hasta el umbral de advertencia
    mockDateNow.mockReturnValue(1000000 + 7000); // +7 segundos (30% restante)

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isWarning).toBe(true);
    expect(result.current.timeRemaining).toBe(3);
    expect(result.current.progress).toBe(30);
  });

  it('debe marcar como expirado cuando se agota el tiempo', () => {
    const config = {
      enabled: true,
      duration: 5,
      autoSubmit: false
    };

    const onTimeout = jest.fn();
    const { result } = renderHook(() => useStepTimeout(config, onTimeout));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo completo
    mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.progress).toBe(0);
    expect(onTimeout).toHaveBeenCalled();
  });

  it('debe pausar y reanudar correctamente', () => {
    const config = {
      enabled: true,
      duration: 10,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo
    mockDateNow.mockReturnValue(1000000 + 3000); // +3 segundos

    act(() => {
      result.current.pauseTimeout();
    });

    expect(result.current.isActive).toBe(false);

    // Simular más tiempo mientras está pausado
    mockDateNow.mockReturnValue(1000000 + 8000); // +8 segundos

    act(() => {
      result.current.resumeTimeout();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.timeRemaining).toBe(5); // 10 - 3 = 7, pero ajustado por el tiempo pausado
  });

  it('debe resetear correctamente', () => {
    const config = {
      enabled: true,
      duration: 10,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo
    mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos

    act(() => {
      result.current.resetTimeout();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.timeRemaining).toBe(10);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it('debe extender el timeout correctamente', () => {
    const config = {
      enabled: true,
      duration: 10,
      autoSubmit: false
    };

    const { result } = renderHook(() => useStepTimeout(config));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo
    mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos

    act(() => {
      result.current.extendTimeout(5); // Agregar 5 segundos
    });

    expect(result.current.timeRemaining).toBe(10); // 15 - 5 = 10
    expect(result.current.progress).toBe(66.67); // 10/15 * 100
  });

  it('debe ejecutar auto-submit cuando está configurado', () => {
    const config = {
      enabled: true,
      duration: 5,
      autoSubmit: true
    };

    const onTimeout = jest.fn();
    const { result } = renderHook(() => useStepTimeout(config, onTimeout));

    act(() => {
      result.current.startTimeout();
    });

    // Simular paso del tiempo completo
    mockDateNow.mockReturnValue(1000000 + 5000); // +5 segundos

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isExpired).toBe(true);
    expect(onTimeout).toHaveBeenCalled();
  });
});
