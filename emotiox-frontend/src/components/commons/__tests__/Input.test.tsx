import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../../../test/utils';
import Input from '../Input';

describe('Input Component', () => {
  it('renders input with label', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
      />
    );
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        error="Email is required"
      />
    );
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('calls onChange when user types', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={handleChange}
      />
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        disabled
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('shows placeholder text', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        placeholder="Enter your email"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter your email');
  });

  it('has correct type attribute', () => {
    render(
      <Input
        id="password"
        label="Password"
        type="password"
        value=""
        onChange={() => {}}
      />
    );
    
    const input = screen.getByLabelText(/password/i);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('has autocomplete attribute', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        autoComplete="email"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('is required when required prop is true', () => {
    render(
      <Input
        id="email"
        label="Email"
        value=""
        onChange={() => {}}
        required
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });
});
