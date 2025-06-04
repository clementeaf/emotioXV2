// Utility functions for standardized form behavior

export interface ButtonTextOptions {
  isSaving: boolean;
  isLoading: boolean;
  hasExistingData: boolean;
  isNavigating?: boolean;
  customSavingText?: string;
  customUpdateText?: string;
  customCreateText?: string;
}

/**
 * Generate standardized button text based on form state
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

  if (isNavigating) return 'Pasando al siguiente módulo...';
  if (isSaving || isLoading) return customSavingText;
  if (hasExistingData) return customUpdateText;
  return customCreateText;
}

/**
 * Generate button disabled state based on form conditions
 */
export function getButtonDisabledState(options: {
  isRequired?: boolean;
  value: unknown;
  isSaving: boolean;
  isLoading: boolean;
  hasError?: boolean;
  customValidation?: () => boolean;
}): boolean {
  const { isRequired = false, value, isSaving, isLoading, hasError = false, customValidation } = options;

  // Loading or saving states
  if (isSaving || isLoading) return true;

  // Error state
  if (hasError) return true;

  // Custom validation
  if (customValidation && !customValidation()) return true;

  // Required field validation
  if (isRequired) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
  }

  return false;
}

/**
 * Format error messages consistently
 */
export function formatErrorMessage(error: string | null, fieldName?: string): string | null {
  if (!error) return null;
  
  const prefix = fieldName ? `${fieldName}: ` : '';
  return `${prefix}${error}`;
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
 * Generate placeholder options for mock mode
 */
export function getMockOptions<T>(
  type: 'single' | 'multiple' | 'ranking',
  itemCount = 3,
  customPrefix?: string
): T[] {
  const prefix = customPrefix || 
    (type === 'multiple' ? 'Opción Múltiple' : 
     type === 'ranking' ? 'Item Ranking' : 
     'Opción');

  return Array.from({ length: itemCount }, (_, i) => 
    `${prefix} ${String.fromCharCode(65 + i)}` as T
  );
}

/**
 * Safe value comparison for form state changes
 */
export function hasValueChanged(oldValue: unknown, newValue: unknown): boolean {
  if (oldValue === newValue) return false;
  
  // Handle arrays
  if (Array.isArray(oldValue) && Array.isArray(newValue)) {
    if (oldValue.length !== newValue.length) return true;
    return oldValue.some((item, index) => item !== newValue[index]);
  }
  
  // Handle objects
  if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  }
  
  return true;
}

/**
 * Debounce function for auto-save functionality
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Extract company name from question text for SmartVOC components
 */
export function formatQuestionText(questionText: string, companyName?: string): string {
  if (!companyName) return questionText;
  return questionText.replace(/\[company\]|\[empresa\]/gi, companyName);
}

/**
 * Common loading indicator props
 */
export function getLoadingIndicatorProps(message = 'Cargando...') {
  return {
    message,
    className: 'w-full h-full flex items-center justify-center p-6 text-center text-neutral-500'
  };
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