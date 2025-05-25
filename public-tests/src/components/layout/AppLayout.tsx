import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { AppLayoutProps } from './types';

export function AppLayout({ children }: AppLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <Sidebar 
        isMobileSidebarOpen={isMobileSidebarOpen} 
        setIsMobileSidebarOpen={setIsMobileSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* <Header openMobileSidebar={() => setIsMobileSidebarOpen(true)} /> */}
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 