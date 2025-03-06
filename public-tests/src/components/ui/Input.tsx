import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    error, 
    label, 
    helperText, 
    fullWidth = true,
    ...props 
  }, ref) => {
    const baseStyles = 'px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';
    const errorStyles = error ? 'border-danger-500 focus:ring-danger-500' : 'border-neutral-300';
    const widthStyles = fullWidth ? 'w-full' : '';

    return (
      <div className={cn('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label className="mb-1.5 text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            baseStyles,
            errorStyles,
            widthStyles,
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-neutral-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input }; 