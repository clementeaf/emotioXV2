import React from 'react';

interface FormColumnProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const FormColumn: React.FC<FormColumnProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-h-[800px] min-w-[600px]">
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>

        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
