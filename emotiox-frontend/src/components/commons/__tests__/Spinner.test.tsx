import { describe, it, expect } from 'vitest';
import { render } from '../../../test/utils';
import Spinner from '../Spinner';

describe('Spinner Component', () => {
  it('renders spinner with default props', () => {
    render(<Spinner />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with small size', () => {
    render(<Spinner size="sm" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('renders with medium size', () => {
    render(<Spinner size="md" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('renders with large size', () => {
    render(<Spinner size="lg" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('renders with blue color', () => {
    render(<Spinner color="blue" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-blue-600');
  });

  it('renders with white color', () => {
    render(<Spinner color="white" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-white');
  });

  it('renders with gray color', () => {
    render(<Spinner color="gray" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('border-gray-600');
  });

  it('applies custom className', () => {
    render(<Spinner className="custom-class" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    render(<Spinner />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('combines size and color correctly', () => {
    render(<Spinner size="lg" color="blue" />);
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-blue-600');
  });
});