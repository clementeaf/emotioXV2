import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../test/utils';
import Alert from '../Alert';

describe('Alert Component', () => {
  it('renders alert with children', () => {
    render(<Alert>This is an alert message</Alert>);
    
    expect(screen.getByText('This is an alert message')).toBeInTheDocument();
  });

  it('renders error alert by default', () => {
    render(<Alert type="error">Error message</Alert>);
    
    const alert = screen.getByText('Error message');
    expect(alert).toBeInTheDocument();
  });

  it('renders success alert', () => {
    render(<Alert type="success">Success message</Alert>);
    
    const alert = screen.getByText('Success message');
    expect(alert).toBeInTheDocument();
  });

  it('renders warning alert', () => {
    render(<Alert type="warning">Warning message</Alert>);
    
    const alert = screen.getByText('Warning message');
    expect(alert).toBeInTheDocument();
  });

  it('renders info alert', () => {
    render(<Alert type="info">Info message</Alert>);
    
    const alert = screen.getByText('Info message');
    expect(alert).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Alert className="custom-class">Alert message</Alert>);
    
    const alert = screen.getByText('Alert message').closest('div');
    expect(alert).toHaveClass('custom-class');
  });

  it('renders with icon for each type', () => {
    const { rerender } = render(<Alert type="error">Error</Alert>);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Alert type="success">Success</Alert>);
    expect(screen.getByText('✅')).toBeInTheDocument();

    rerender(<Alert type="warning">Warning</Alert>);
    expect(screen.getByText('⚠️')).toBeInTheDocument();

    rerender(<Alert type="info">Info</Alert>);
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });
});