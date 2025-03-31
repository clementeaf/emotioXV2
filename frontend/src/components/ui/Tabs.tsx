'use client';

import React, { ReactNode } from 'react';

interface TabProps {
  id: string;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

interface TabsProps {
  children: ReactNode;
  activeTab: string;
  onChange: (tabId: string) => void;
}

export const Tabs: React.FC<TabsProps> = ({ children, activeTab, onChange }) => {
  // Extraer propiedades de los hijos (Tab components)
  const tabElements = React.Children.toArray(children).filter(
    (child) => React.isValidElement(child) && child.type === Tab
  ) as React.ReactElement<TabProps>[];

  return (
    <div className="w-full">
      <div className="flex border-b border-neutral-200">
        {tabElements.map((tabElement) => {
          const { id, label, disabled } = tabElement.props;
          const isActive = id === activeTab;
          
          return (
            <button
              key={id}
              type="button"
              className={`px-4 py-2 text-sm font-medium ${
                isActive 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-neutral-600 hover:text-blue-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onChange(id);
                }
              }}
              disabled={disabled}
            >
              {label}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4">
        {tabElements.map((tabElement) => {
          const { id, children } = tabElement.props;
          return (
            <div key={id} className={id === activeTab ? 'block' : 'hidden'}>
              {children}
            </div>
          );
        })}
      </div>
    </div>
  );
}; 