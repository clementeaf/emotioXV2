import React from 'react';

interface NavigationItemProps {
  id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  onClick: () => void;
  getItemName?: (id: string) => string;
  className?: string;
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  id,
  title,
  subtitle,
  isActive,
  onClick,
  getItemName,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        isActive
          ? 'bg-blue-50 border-blue-200 text-blue-900'
          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
      } ${className}`}
    >
      <div className="font-medium">
        {getItemName ? getItemName(id) : title}
      </div>
      <div className="text-sm text-gray-500 truncate">
        {subtitle || 'Sin título'}
      </div>
    </button>
  );
};
