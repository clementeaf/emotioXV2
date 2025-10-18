import React from 'react';
import SidebarHeader from './SidebarHeader';
import NavigationMenu from './NavigationMenu';
import RecentResearchSection from './RecentResearchSection';
import type { SidebarProps } from './types';

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggle }) => {
  return (
    <aside className={`bg-white rounded-lg shadow-lg transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle || (() => {})} />
      <NavigationMenu isCollapsed={isCollapsed} />
      <RecentResearchSection isCollapsed={isCollapsed} />
    </aside>
  );
};

export default Sidebar;
