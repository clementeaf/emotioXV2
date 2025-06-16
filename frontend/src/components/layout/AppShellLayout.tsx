import React from 'react';

interface AppShellLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  navbar?: React.ReactNode;
  className?: string;
}

export function AppShellLayout({ sidebar, children, navbar, className }: AppShellLayoutProps) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-72 flex-shrink-0 flex flex-col">
        {sidebar}
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        {navbar && <div className="sticky top-0 z-30 bg-white border-b border-neutral-100">{navbar}</div>}
        <main className={`flex-1 p-8 ${className || ''}`}>{children}</main>
      </div>
    </div>
  );
}
