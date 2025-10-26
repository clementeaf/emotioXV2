import React from 'react';

interface NavigationContainerProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export const NavigationContainer: React.FC<NavigationContainerProps> = ({
  children,
  height = 'h-[500px]',
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${height} overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};
