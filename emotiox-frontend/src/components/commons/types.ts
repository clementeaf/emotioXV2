import type { ReactNode, ErrorInfo } from 'react';

/**
 * Base button props interface
 */
export interface ButtonProps {
  children?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

/**
 * Toggle button props interface
 */
export interface ToggleButtonProps extends ButtonProps {
  isActive?: boolean;
  activeText?: string;
  inactiveText?: string;
  activeIcon?: ReactNode;
  inactiveIcon?: ReactNode;
}

/**
 * Input props interface
 */
export interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  autoComplete?: string;
}

/**
 * Alert props interface
 */
export interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  children: ReactNode;
  className?: string;
}

/**
 * Spinner props interface
 */
export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'white' | 'gray';
  className?: string;
}

/**
 * ErrorBoundary props interface
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ErrorBoundary state interface
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * Button size types
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * LoadingPage props interface
 */
export interface LoadingPageProps {
  message?: string;
  showCard?: boolean;
}
