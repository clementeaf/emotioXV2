import React, { useState } from 'react';
import { Sidebar, ResearchSidebar } from './index';
import Upbar from './Upbar';
import MainContent from './MainContent';
import type { LayoutProps } from './types';

const Layout: React.FC<LayoutProps> = ({ children, user, researchId }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen p-4 gap-4" style={{ backgroundColor: '#f1f5f9' }}>
      {researchId ? (
        <ResearchSidebar
          researchId={researchId}
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      ) : (
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden gap-4">
        <Upbar user={user} />

        <MainContent>
          {children}
        </MainContent>
      </div>
    </div>
  );
};

export default Layout;
