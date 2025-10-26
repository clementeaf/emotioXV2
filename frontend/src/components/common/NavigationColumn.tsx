import React from 'react';
import { NavigationItem, AddItemButton, NavigationHeader, NavigationContainer } from './atomic';

export interface NavigationItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface NavigationColumnProps {
  title: string | React.ReactNode;
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
    <div className={`min-w-[350px]`}>
        <div className="rounded-lg border border-gray-200 p-6 h-[850px] bg-white shadow-sm">
          <NavigationHeader title={title} />
          <NavigationContainer height="h-[750px]">
            {items.map((item, index) => (
              <NavigationItem
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                isActive={activeIndex === index}
                onClick={() => onItemClick(index)}
                getItemName={getItemName}
              />
            ))}
            
            {onAddClick && (
              <AddItemButton
                onClick={onAddClick}
                text={addButtonText}
              />
            )}
          </NavigationContainer>
        </div>
    </div>
  );
};
