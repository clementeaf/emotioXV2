/**
 * Preview Column Component
 * Muestra la vista previa de cómo se verá la pregunta para los participantes
 */

import React from 'react';

interface PreviewColumnProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const PreviewColumn: React.FC<PreviewColumnProps> = ({
  title,
  subtitle,
  children,
  className = ''
}) => {
  return (
    <div className={`rounded-lg border border-gray-200 p-6 h-[850px] min-w-[400px] ${className}`}>
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="space-y-4 h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
