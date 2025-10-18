import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    // Suppress console.error for these tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/¡oops! algo salió mal/i)).toBeInTheDocument();
    expect(screen.getByText(/ha ocurrido un error inesperado/i)).toBeInTheDocument();
  });

  it('shows error details in development mode', () => {
    // Mock development environment
    vi.stubGlobal('import', { meta: { env: { DEV: true } } });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/error details/i)).toBeInTheDocument();
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('hides error details in production mode', () => {
    // Mock production environment by stubbing import.meta.env.DEV
    const originalEnv = import.meta.env;
    Object.defineProperty(import.meta, 'env', {
      value: { ...originalEnv, DEV: false },
      writable: true
    });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    // In production, error details should be hidden
    expect(screen.queryByText(/error details/i)).not.toBeInTheDocument();
    
    // Restore original environment
    Object.defineProperty(import.meta, 'env', {
      value: originalEnv,
      writable: true
    });
  });


  it('has reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const reloadButton = screen.getByText(/recargar página/i);
    expect(reloadButton).toBeInTheDocument();
  });

  it('shows support message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/si el problema persiste, contacta al soporte técnico/i)).toBeInTheDocument();
  });

  it('has correct error icon', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('logs error to console in development', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    vi.stubGlobal('import', { meta: { env: { DEV: true } } });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      expect.any(Error),
      expect.any(Object)
    );
  });

  it('renders with correct styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });
});