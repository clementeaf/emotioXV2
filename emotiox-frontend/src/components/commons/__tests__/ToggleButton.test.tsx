import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/utils';
import ToggleButton from '../ToggleButton';

describe('ToggleButton Component', () => {
  it('renders toggle button with children', () => {
    render(<ToggleButton>Toggle me</ToggleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<ToggleButton onClick={handleClick}>Toggle</ToggleButton>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows active state when isActive is true', () => {
    render(
      <ToggleButton isActive={true} activeText="Active" inactiveText="Inactive">
        Toggle
      </ToggleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows inactive state when isActive is false', () => {
    render(
      <ToggleButton isActive={false} activeText="Active" inactiveText="Inactive">
        Toggle
      </ToggleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders with active icon when provided', () => {
    render(
      <ToggleButton 
        isActive={true} 
        activeIcon="🔥" 
        inactiveIcon="❄️"
      >
        Temperature
      </ToggleButton>
    );
    
    expect(screen.getByText('🔥')).toBeInTheDocument();
  });

  it('renders with inactive icon when provided', () => {
    render(
      <ToggleButton 
        isActive={false} 
        activeIcon="🔥" 
        inactiveIcon="❄️"
      >
        Temperature
      </ToggleButton>
    );
    
    expect(screen.getByText('❄️')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ToggleButton disabled>Disabled toggle</ToggleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<ToggleButton className="custom-class">Toggle</ToggleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('has correct aria-label when provided', () => {
    render(<ToggleButton ariaLabel="Toggle sidebar">Toggle</ToggleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Toggle sidebar');
  });

  it('shows correct text based on active state', () => {
    const { rerender } = render(
      <ToggleButton isActive={true} activeText="ON" inactiveText="OFF">
        Power
      </ToggleButton>
    );
    
    expect(screen.getByText('ON')).toBeInTheDocument();
    
    rerender(
      <ToggleButton isActive={false} activeText="ON" inactiveText="OFF">
        Power
      </ToggleButton>
    );
    
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });
});