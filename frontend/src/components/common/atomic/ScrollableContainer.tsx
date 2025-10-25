import React from 'react';

interface ScrollableContainerProps {
  children: React.ReactNode;
  height?: string;
  className?: string;
}

export const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  height = 'h-[140px]',
  className = ''
}) => {
  return (
    <div className={`flex flex-col overflow-y-auto ${height} justify-between ${className}`}>
      {children}
    </div>
  );
};
