import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import Card from '../Card';

describe('Card Component', () => {
  it('renders card with children', () => {
    render(<Card>Card content</Card>);
    
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('has correct default styling', () => {
    render(<Card>Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-4');
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  it('renders with no padding when padding is none', () => {
    render(<Card padding="none">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl');
    expect(card).not.toHaveClass('p-2', 'p-4', 'p-6');
  });

  it('renders with small padding when padding is sm', () => {
    render(<Card padding="sm">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-2');
  });

  it('renders with medium padding when padding is md', () => {
    render(<Card padding="md">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-4');
  });

  it('renders with large padding when padding is lg', () => {
    render(<Card padding="lg">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-6');
  });

  it('combines custom className with default classes', () => {
    render(<Card className="shadow-lg" padding="lg">Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-6', 'shadow-lg');
  });

  it('renders without children', () => {
    render(<Card />);
    
    // When no children, the Card component itself is the element we're looking for
    const card = document.querySelector('.bg-white.rounded-2xl');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-white', 'rounded-2xl', 'p-4');
  });

  it('maintains consistent styling across different padding sizes', () => {
    const { rerender } = render(<Card padding="sm">Small</Card>);
    expect(screen.getByText('Small').closest('div')).toHaveClass('p-2');

    rerender(<Card padding="md">Medium</Card>);
    expect(screen.getByText('Medium').closest('div')).toHaveClass('p-4');

    rerender(<Card padding="lg">Large</Card>);
    expect(screen.getByText('Large').closest('div')).toHaveClass('p-6');
  });
});
