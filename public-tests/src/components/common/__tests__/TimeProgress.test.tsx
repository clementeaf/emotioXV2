import { render, screen } from '@testing-library/react';
import { useResponseTiming } from '../../../hooks/useResponseTiming';
import { TimeProgress } from '../TimeProgress';

// Mock del hook useResponseTiming
jest.mock('../../../hooks/useResponseTiming');

const mockUseResponseTiming = useResponseTiming as jest.MockedFunction<typeof useResponseTiming>;

describe('TimeProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar cuando no hay timer activo y no hay duración', () => {
    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: false,
      globalStartTime: null,
      globalEndTime: null,
      getGlobalDuration: jest.fn().mockReturnValue(null),
      globalDuration: null,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    const { container } = render(<TimeProgress />);
    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar tiempo transcurrido cuando el timer está activo', () => {
    const mockGetGlobalDuration = jest.fn().mockReturnValue(65000); // 65 segundos

    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: true,
      globalStartTime: Date.now() - 65000,
      globalEndTime: null,
      getGlobalDuration: mockGetGlobalDuration,
      globalDuration: 65000,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    render(<TimeProgress />);

    expect(screen.getByText('1m 5s')).toBeInTheDocument();
    expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
  });

  it('debe mostrar tiempo transcurrido cuando el timer está detenido', () => {
    const mockGetGlobalDuration = jest.fn().mockReturnValue(120000); // 2 minutos

    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: false,
      globalStartTime: Date.now() - 120000,
      globalEndTime: Date.now(),
      getGlobalDuration: mockGetGlobalDuration,
      globalDuration: 120000,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    render(<TimeProgress />);

    expect(screen.getByText('2m 0s')).toBeInTheDocument();
  });

  it('debe mostrar variante detailed correctamente', () => {
    const mockGetGlobalDuration = jest.fn().mockReturnValue(3600000); // 1 hora
    const mockStartTime = Date.now() - 3600000;

    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: true,
      globalStartTime: mockStartTime,
      globalEndTime: null,
      getGlobalDuration: mockGetGlobalDuration,
      globalDuration: 3600000,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    render(<TimeProgress variant="detailed" />);

    expect(screen.getByText('Tiempo de sesión')).toBeInTheDocument();
    expect(screen.getByText('1h 0m 0s')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText(/Iniciado:/)).toBeInTheDocument();
  });

  it('debe mostrar variante progress-bar correctamente', () => {
    const mockGetGlobalDuration = jest.fn().mockReturnValue(900000); // 15 minutos

    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: true,
      globalStartTime: Date.now() - 900000,
      globalEndTime: null,
      getGlobalDuration: mockGetGlobalDuration,
      globalDuration: 900000,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    render(<TimeProgress variant="progress-bar" />);

    expect(screen.getByText('Progreso de tiempo')).toBeInTheDocument();
    expect(screen.getByText('15m 0s')).toBeInTheDocument();
    expect(screen.getByText('Sesión en progreso...')).toBeInTheDocument();

    // Verificar que la barra de progreso existe
    const progressBar = screen.getByRole('generic').querySelector('.bg-blue-600');
    expect(progressBar).toBeInTheDocument();
  });

  it('debe formatear duración correctamente para diferentes valores', () => {
    const testCases = [
      { duration: 30000, expected: '30s' }, // 30 segundos
      { duration: 90000, expected: '1m 30s' }, // 1 minuto 30 segundos
      { duration: 3661000, expected: '1h 1m 1s' }, // 1 hora 1 minuto 1 segundo
    ];

    testCases.forEach(({ duration, expected }) => {
      const mockGetGlobalDuration = jest.fn().mockReturnValue(duration);

      mockUseResponseTiming.mockReturnValue({
        isGlobalTimerRunning: true,
        globalStartTime: Date.now() - duration,
        globalEndTime: null,
        getGlobalDuration: mockGetGlobalDuration,
        globalDuration: duration,
        activeSectionTimers: new Set(),
        sectionTimings: [],
        startGlobalTimer: jest.fn(),
        stopGlobalTimer: jest.fn(),
        startSectionTimer: jest.fn(),
        stopSectionTimer: jest.fn(),
        getSectionDuration: jest.fn(),
        resetAllTimers: jest.fn(),
        getTimingInfo: jest.fn()
      });

      const { unmount } = render(<TimeProgress />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('debe manejar errores de formateo de duración', () => {
    const mockGetGlobalDuration = jest.fn().mockReturnValue(-1000); // Duración negativa

    mockUseResponseTiming.mockReturnValue({
      isGlobalTimerRunning: true,
      globalStartTime: Date.now(),
      globalEndTime: null,
      getGlobalDuration: mockGetGlobalDuration,
      globalDuration: -1000,
      activeSectionTimers: new Set(),
      sectionTimings: [],
      startGlobalTimer: jest.fn(),
      stopGlobalTimer: jest.fn(),
      startSectionTimer: jest.fn(),
      stopSectionTimer: jest.fn(),
      getSectionDuration: jest.fn(),
      resetAllTimers: jest.fn(),
      getTimingInfo: jest.fn()
    });

    render(<TimeProgress />);

    expect(screen.getByText('0s')).toBeInTheDocument();
  });
});
