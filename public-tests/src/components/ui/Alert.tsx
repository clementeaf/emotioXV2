import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'error' | 'warning' | 'success' | 'info';
  title?: string;
  description?: string;
  errorId?: string;
  errorType?: string;
  errorMessage?: string;
}

export function Alert({
  className,
  variant = 'default',
  title,
  description,
  errorId,
  errorType,
  errorMessage,
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    default: 'bg-neutral-50 text-neutral-800 border-neutral-200',
    error: 'bg-danger-50 text-danger-800 border-danger-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    info: 'bg-primary-50 text-primary-800 border-primary-200',
  };
  
  const iconMap = {
    default: Info,
    error: XCircle,
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
  };
  
  const Icon = iconMap[variant];

  return (
    <div
      className={cn(
        'p-4 border rounded-lg flex items-start gap-3',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        {title && <h4 className="font-medium mb-1">{title}</h4>}
        {description && <p className="text-sm">{description}</p>}
        
        {/* Contenido adicional */}
        {children && <div className="mt-2">{children}</div>}
        
        {/* Información de depuración */}
        {(errorId || errorType || errorMessage) && (
          <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-sm space-y-1">
            {errorId && (
              <div className="font-mono bg-black/5 p-2 rounded">
                ID: {errorId}
              </div>
            )}
            {errorType && (
              <div>
                <span className="font-medium">Tipo de error:</span> {errorType}
              </div>
            )}
            {errorMessage && (
              <div>
                <span className="font-medium">Mensaje de error:</span> {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CSRFErrorAlert({ errorId, errorMessage }: { errorId?: string; errorMessage?: string }) {
  return (
    <Alert
      variant="error"
      title="Ha ocurrido un error"
      description="Los tokens CSRF no coinciden. Por favor, recarga la página e intenta nuevamente."
      errorId={errorId}
      errorType="CSRFError"
      errorMessage={errorMessage || "400 Bad Request: The CSRF tokens do not match."}
    />
  );
} 