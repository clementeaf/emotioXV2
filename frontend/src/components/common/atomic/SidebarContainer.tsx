import React from 'react';

interface SidebarContainerProps {
  children: React.ReactNode;
  title: string;
  height?: string;
  width?: string;
  className?: string;
}

export const SidebarContainer: React.FC<SidebarContainerProps> = ({
  children,
  title,
  height = 'h-[580px]',
  width = 'min-w-[400px]',
  className = ''
}) => {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 overflow-y-auto ${width} ${height} ${className}`}>
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
};
