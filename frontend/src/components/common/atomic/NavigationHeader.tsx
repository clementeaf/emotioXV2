import React from 'react';

interface NavigationHeaderProps {
  title: string | React.ReactNode;
  className?: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  title,
  className = ''
}) => {
  return (
    <h3 className={`text-lg font-bold text-gray-900 mb-6 ${className}`}>
      {title}
    </h3>
  );
};
