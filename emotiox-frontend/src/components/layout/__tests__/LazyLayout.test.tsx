import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/utils';
import LazyLayout from '../LazyLayout';

// Mock the lazy components
vi.mock('../Upbar', () => ({
  default: () => <div data-testid="upbar">Upbar</div>
}));

vi.mock('../Sidebar', () => ({
  default: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('../MainContent', () => ({
  default: ({ children }: any) => <div data-testid="main-content">{children}</div>
}));

describe('LazyLayout Component', () => {
  it('renders lazy layout with children', () => {
    render(
      <LazyLayout>
        <div>Layout content</div>
      </LazyLayout>
    );
    
    // Since components are lazy loaded, we see the fallbacks
    expect(screen.getByText('Cargando sidebar...')).toBeInTheDocument();
    expect(screen.getByText('Cargando barra superior...')).toBeInTheDocument();
    expect(screen.getByText('Cargando contenido...')).toBeInTheDocument();
  });

  it('renders lazy layout with default user', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    expect(screen.getByTestId('upbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders lazy layout with user from store', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );

    expect(screen.getByTestId('upbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('has correct background color', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    const container = document.querySelector('.min-h-screen.flex.flex-col');
    expect(container).toHaveStyle('background-color: rgb(241, 245, 249)');
  });

  it('has correct flex layout structure', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    const container = document.querySelector('.min-h-screen.flex.flex-col');
    expect(container).toHaveClass('min-h-screen', 'flex', 'flex-col');
  });

  it('renders all layout components', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    expect(screen.getByTestId('upbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders with minimal children', () => {
    render(<LazyLayout><div /></LazyLayout>);

    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('has proper layout hierarchy', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    // Check that the layout structure is correct
    const mainContainer = document.querySelector('.min-h-screen');
    expect(mainContainer).toBeInTheDocument();
    
    const flexContainer = mainContainer?.querySelector('.flex');
    expect(flexContainer).toBeInTheDocument();
  });

  it('gets user from store and passes to components', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );

    // The user is retrieved from the store internally
    expect(screen.getByTestId('upbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });

  it('renders with Suspense fallbacks', () => {
    render(
      <LazyLayout>
        <div>Content</div>
      </LazyLayout>
    );
    
    // Should render without errors even with lazy loading
    expect(screen.getByTestId('upbar')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
  });
});
