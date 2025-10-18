import React from 'react';
import { Button } from '../commons';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <Button
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="text-lg">←</span>
        {!isCollapsed && <span>Comprimir</span>}
      </Button>
    </div>
  );
};

export default SidebarHeader;
