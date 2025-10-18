import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import LoadingPage from '../LoadingPage';

describe('LoadingPage Component', () => {
  it('renders loading page with default message', () => {
    render(<LoadingPage />);
    
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingPage message="Loading data..." />);
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders with card when showCard is true', () => {
    render(<LoadingPage showCard={true} />);
    
    const card = document.querySelector('.bg-white');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl');
  });

  it('renders without card when showCard is false', () => {
    render(<LoadingPage showCard={false} />);
    
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('renders with card by default', () => {
    render(<LoadingPage />);
    
    const card = document.querySelector('.bg-white');
    expect(card).toBeInTheDocument();
  });

  it('has correct background color', () => {
    render(<LoadingPage />);
    
    const container = document.querySelector('[style*="background-color"]');
    expect(container).toHaveStyle('background-color: rgb(241, 245, 249)');
  });

  it('renders spinner with correct attributes', () => {
    render(<LoadingPage />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('combines message and showCard correctly', () => {
    render(<LoadingPage message="Custom loading..." showCard={false} />);
    
    expect(screen.getByText('Custom loading...')).toBeInTheDocument();
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });

  it('renders with full screen layout', () => {
    render(<LoadingPage />);
    
    const container = document.querySelector('.min-h-screen');
    expect(container).toBeInTheDocument();
  });
});