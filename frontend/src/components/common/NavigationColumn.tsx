import React from 'react';

export interface NavigationItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface NavigationColumnProps {
  title: string;
  items: NavigationItem[];
  activeIndex: number;
  onItemClick: (index: number) => void;
  onAddClick?: () => void;
  addButtonText?: string;
  getItemName?: (id: string) => string;
  className?: string;
}

export const NavigationColumn: React.FC<NavigationColumnProps> = ({
  title,
  items,
  activeIndex,
  onItemClick,
  onAddClick,
  addButtonText = '+ Agregar',
  getItemName,
}) => {
  return (
    <div className={`min-w-[250px] max-h-[500px]`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => onItemClick(index)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeIndex === index
                    ? 'bg-blue-50 border-blue-200 text-blue-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">
                  {getItemName ? getItemName(item.id) : item.title}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {item.subtitle || 'Sin título'}
                </div>
              </button>
            ))}
            
            {onAddClick && (
              <button
                onClick={onAddClick}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                {addButtonText}
              </button>
            )}
          </div>
        </div>
    </div>
  );
};
