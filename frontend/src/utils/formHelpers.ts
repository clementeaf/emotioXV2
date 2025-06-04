/**
 * Form Helper Utilities
 * Provides consistent styling and spacing for all forms
 * Based on the design system from public-tests
 */

export interface ButtonTextOptions {
  isSaving?: boolean;
  isLoading?: boolean;
  hasExistingData?: boolean;
  isNavigating?: boolean;
  customSavingText?: string;
  customUpdateText?: string;
  customCreateText?: string;
}

/**
 * Get standardized button text based on form state
 */
export function getStandardButtonText(options: ButtonTextOptions): string {
  const {
    isSaving,
    isLoading,
    hasExistingData,
    isNavigating = false,
    customSavingText = 'Guardando...',
    customUpdateText = 'Actualizar y continuar',
    customCreateText = 'Guardar y continuar'
  } = options;

  if (isNavigating) {
    return 'Pasando al siguiente módulo...';
  }
  if (isSaving || isLoading) {
    return customSavingText;
  }
  if (hasExistingData) {
    return customUpdateText;
  }
  return customCreateText;
}

/**
 * Get button disabled state based on form conditions
 */
export function getButtonDisabledState(options: {
  isRequired?: boolean;
  value?: unknown;
  isSaving?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
}): boolean {
  const { isRequired, value, isSaving, isLoading, hasError } = options;
  
  if (isSaving || isLoading) {
    return true;
  }
  if (hasError) {
    return true;
  }
  if (isRequired && (!value || (Array.isArray(value) && value.length === 0))) {
    return true;
  }
  
  return false;
}

/**
 * Get standard error display props
 */
export function getErrorDisplayProps(error: string | null) {
  return {
    hasError: !!error,
    errorMessage: error,
    errorClassName: 'text-sm text-red-600 mb-4 text-center'
  };
}

/**
 * Standard form container styling
 */
export function getFormContainerClass(variant: 'default' | 'centered' | 'wide' = 'default'): string {
  const baseClasses = 'bg-white p-8 rounded-lg shadow-md';
  
  const variantClasses = {
    default: 'max-w-lg w-full',
    centered: 'max-w-lg w-full mx-auto',
    wide: 'max-w-2xl w-full mx-auto'
  };

  return `${baseClasses} ${variantClasses[variant]}`;
}

/**
 * Standard spacing classes for form elements
 */
export const formSpacing = {
  section: 'mb-8',
  field: 'mb-4',
  label: 'mb-2',
  error: 'mt-2',
  button: 'mt-6',
  scaleGap: 'gap-2',
  scaleLabels: 'mt-2 px-1'
} as const;

/**
 * Get progress percentage
 */
export function getProgressPercentage(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((completed / total) * 100);
}

/**
 * Standard scale button styling helper
 */
export function getScaleButtonClass(options: {
  isSelected: boolean;
  isDisabled?: boolean;
  variant?: 'circular' | 'rectangular';
  size?: 'sm' | 'md' | 'lg';
}): string {
  const { isSelected, isDisabled = false, variant = 'circular', size = 'md' } = options;

  const baseClasses = 'border flex items-center justify-center font-medium transition-colors';
  
  const variantClasses = {
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-9 h-9 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const stateClasses = isSelected
    ? 'bg-indigo-600 text-white border-indigo-600'
    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100';

  const disabledClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : '';

  return [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    stateClasses,
    disabledClasses
  ].filter(Boolean).join(' ');
}

/**
 * Format question text with company name replacement
 */
export function formatQuestionText(text: string, companyName?: string): string {
  if (!companyName) {
    return text;
  }
  return text.replace(/{company}/g, companyName);
} 