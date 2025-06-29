import { render, screen } from '@testing-library/react';
import { StepTimeoutState } from '../../../hooks/useStepTimeout';
import { StepTimeoutDisplay } from '../StepTimeoutDisplay';

describe('StepTimeoutDisplay', () => {
  const createTimeoutState = (overrides: Partial<StepTimeoutState> = {}): StepTimeoutState => ({
    isActive: true,
    timeRemaining: 60,
    isWarning: false,
    isExpired: false,
    progress: 100,
    ...overrides
  });

  it('no debe renderizar cuando no está activo', () => {
    const timeoutState = createTimeoutState({ isActive: false });

    const { container } = render(
      <StepTimeoutDisplay timeoutState={timeoutState} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar tiempo en formato correcto para variante minimal', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 65 });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="minimal" />
    );

    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('debe mostrar tiempo en segundos cuando es menor a 1 minuto', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 45 });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="minimal" />
    );

    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('debe mostrar indicador de advertencia cuando isWarning es true', () => {
    const timeoutState = createTimeoutState({
      timeRemaining: 10,
      isWarning: true,
      progress: 20
    });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="minimal" />
    );

    const warningIndicator = screen.getByRole('generic').querySelector('.bg-orange-500');
    expect(warningIndicator).toBeInTheDocument();
  });

  it('debe mostrar indicador de expirado cuando isExpired es true', () => {
    const timeoutState = createTimeoutState({
      timeRemaining: 0,
      isExpired: true,
      progress: 0
    });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="minimal" />
    );

    const expiredIndicator = screen.getByRole('generic').querySelector('.bg-red-500');
    expect(expiredIndicator).toBeInTheDocument();
  });

  it('debe mostrar variante detailed correctamente', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 30 });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="detailed" />
    );

    expect(screen.getByText('Tiempo restante')).toBeInTheDocument();
    expect(screen.getByText('30s')).toBeInTheDocument();

    // Verificar que la barra de progreso existe
    const progressBar = screen.getByRole('generic').querySelector('.bg-blue-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('debe mostrar mensaje de advertencia en variante detailed', () => {
    const timeoutState = createTimeoutState({
      timeRemaining: 10,
      isWarning: true,
      progress: 20
    });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="detailed" />
    );

    expect(screen.getByText('⚠️ Tiempo limitado')).toBeInTheDocument();
  });

  it('debe mostrar mensaje de expirado en variante detailed', () => {
    const timeoutState = createTimeoutState({
      timeRemaining: 0,
      isExpired: true,
      progress: 0
    });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="detailed" />
    );

    expect(screen.getByText('⏰ Tiempo agotado')).toBeInTheDocument();
  });

  it('debe mostrar variante progress-bar correctamente', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 45 });

    render(
      <StepTimeoutDisplay timeoutState={timeoutState} variant="progress-bar" />
    );

    expect(screen.getByText('Límite de tiempo')).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
    expect(screen.getByText('0s')).toBeInTheDocument();

    // Verificar que la barra de progreso existe
    const progressBar = screen.getByRole('generic').querySelector('.bg-blue-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('debe aplicar colores correctos según el estado', () => {
    // Estado normal
    const normalState = createTimeoutState({ timeRemaining: 60 });
    const { rerender } = render(
      <StepTimeoutDisplay timeoutState={normalState} variant="minimal" />
    );

    expect(screen.getByText('1:00')).toHaveClass('text-neutral-600');

    // Estado de advertencia
    const warningState = createTimeoutState({
      timeRemaining: 10,
      isWarning: true,
      progress: 20
    });
    rerender(<StepTimeoutDisplay timeoutState={warningState} variant="minimal" />);

    expect(screen.getByText('10s')).toHaveClass('text-orange-600');

    // Estado expirado
    const expiredState = createTimeoutState({
      timeRemaining: 0,
      isExpired: true,
      progress: 0
    });
    rerender(<StepTimeoutDisplay timeoutState={expiredState} variant="minimal" />);

    expect(screen.getByText('0s')).toHaveClass('text-red-600');
  });

  it('debe aplicar clases CSS personalizadas', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 30 });

    render(
      <StepTimeoutDisplay
        timeoutState={timeoutState}
        variant="minimal"
        className="custom-class"
      />
    );

    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });

  it('debe ocultar progreso cuando showProgress es false', () => {
    const timeoutState = createTimeoutState({ timeRemaining: 30 });

    render(
      <StepTimeoutDisplay
        timeoutState={timeoutState}
        variant="detailed"
        showProgress={false}
      />
    );

    // La barra de progreso no debe estar presente
    const progressBar = screen.getByRole('generic').querySelector('.bg-blue-500');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('debe ocultar advertencia cuando showWarning es false', () => {
    const timeoutState = createTimeoutState({
      timeRemaining: 10,
      isWarning: true,
      progress: 20
    });

    render(
      <StepTimeoutDisplay
        timeoutState={timeoutState}
        variant="detailed"
        showWarning={false}
      />
    );

    // El mensaje de advertencia no debe estar presente
    expect(screen.queryByText('⚠️ Tiempo limitado')).not.toBeInTheDocument();
  });
});
