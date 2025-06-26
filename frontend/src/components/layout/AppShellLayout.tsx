import React from 'react';

interface AppShellLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  navbar?: React.ReactNode;
  className?: string;
}

export function AppShellLayout({ sidebar, children, className }: AppShellLayoutProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-72 flex flex-col h-screen overflow-y-auto pl-4 pt-20">
        {sidebar}
      </aside>
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <main className={`flex-1 p-8 overflow-y-auto h-full ${className || ''}`}>{children}</main>
      </div>
    </div>
  );
}
