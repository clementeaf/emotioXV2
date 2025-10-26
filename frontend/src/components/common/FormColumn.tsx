import React from 'react';

interface FormColumnProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  navigation?: React.ReactNode;
}

export const FormColumn: React.FC<FormColumnProps> = ({
  title,
  subtitle,
  children,
  navigation,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 p-6 h-auto min-w-[600px]">
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              {subtitle && (
                <p className="text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>
            {navigation && (
              <div className="ml-4">
                {navigation}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};
