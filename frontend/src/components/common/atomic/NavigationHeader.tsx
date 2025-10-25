import React from 'react';

interface NavigationHeaderProps {
  title: string;
  className?: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${className}`}>
      {title}
    </h3>
  );
};
