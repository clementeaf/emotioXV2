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
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
        isActive
          ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      } ${className}`}
    >
      <div className="font-medium text-sm">
        {getItemName ? getItemName(id) : title}
      </div>
      <div className="text-xs text-gray-500 truncate mt-1">
        {subtitle || 'Sin título'}
      </div>
    </button>
  );
};
