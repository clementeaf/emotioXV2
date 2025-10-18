import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import MainContent from '../MainContent';

describe('MainContent Component', () => {
  it('renders with children in single layout', () => {
    render(
      <MainContent layout="single">
        <div>Main content</div>
      </MainContent>
    );
    
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });

  it('renders with single layout by default', () => {
    render(
      <MainContent>
        <div>Default content</div>
      </MainContent>
    );
    
    expect(screen.getByText('Default content')).toBeInTheDocument();
  });

  it('renders with double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left content</div>}
        rightContent={<div>Right content</div>}
      >
        <div>Main content</div>
      </MainContent>
    );
    
    expect(screen.getByText('Left content')).toBeInTheDocument();
    expect(screen.getByText('Right content')).toBeInTheDocument();
  });

  it('renders only left content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left only</div>}
      />
    );
    
    expect(screen.getByText('Left only')).toBeInTheDocument();
  });

  it('renders only right content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        rightContent={<div>Right only</div>}
      />
    );
    
    expect(screen.getByText('Right only')).toBeInTheDocument();
  });

  it('has correct styling for single layout', () => {
    render(
      <MainContent layout="single">
        <div>Content</div>
      </MainContent>
    );
    
    const card = document.querySelector('.bg-white.rounded-2xl');
    expect(card).toHaveClass('flex-1');
  });

  it('has correct styling for double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left</div>}
        rightContent={<div>Right</div>}
      />
    );
    
    const container = document.querySelector('.flex-1.flex.gap-4');
    expect(container).toHaveClass('flex-1', 'flex', 'gap-4');
  });

  it('has correct width for left content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left</div>}
        rightContent={<div>Right</div>}
      />
    );
    
    const leftCard = screen.getByText('Left').closest('.bg-white');
    expect(leftCard).toHaveClass('w-80');
  });

  it('has correct flex styling for right content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left</div>}
        rightContent={<div>Right</div>}
      />
    );
    
    const rightCard = screen.getByText('Right').closest('.bg-white');
    expect(rightCard).toHaveClass('flex-1');
  });

  it('renders without children', () => {
    render(<MainContent />);
    
    // Should not crash and should render the container
    const container = document.querySelector('.flex-1');
    expect(container).toBeInTheDocument();
  });

  it('renders with Card wrapper in single layout', () => {
    render(
      <MainContent layout="single">
        <div>Content</div>
      </MainContent>
    );
    
    const card = screen.getByText('Content').closest('.bg-white');
    expect(card).toHaveClass('rounded-2xl');
  });

  it('renders with Card wrappers in double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left</div>}
        rightContent={<div>Right</div>}
      />
    );
    
    const leftCard = screen.getByText('Left').closest('.bg-white');
    const rightCard = screen.getByText('Right').closest('.bg-white');
    
    expect(leftCard).toHaveClass('rounded-2xl');
    expect(rightCard).toHaveClass('rounded-2xl');
  });

  it('handles empty left content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        rightContent={<div>Right only</div>}
      />
    );
    
    expect(screen.getByText('Right only')).toBeInTheDocument();
    expect(screen.queryByText('Left')).not.toBeInTheDocument();
  });

  it('handles empty right content in double layout', () => {
    render(
      <MainContent 
        layout="double"
        leftContent={<div>Left only</div>}
      />
    );
    
    expect(screen.getByText('Left only')).toBeInTheDocument();
    expect(screen.queryByText('Right')).not.toBeInTheDocument();
  });
});
