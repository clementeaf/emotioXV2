import React from 'react';

import { cn } from '@/lib/utils';

interface SidebarBaseProps {
  userInfo: React.ReactNode;
  topBlock?: React.ReactNode;
  children: React.ReactNode; // menú/secciones
  footer?: React.ReactNode;
  className?: string;
}

export function SidebarBase({ userInfo, topBlock, children, footer, className }: SidebarBaseProps) {
  return (
    <aside
      className={cn(
        'w-full h-full flex flex-col bg-white shadow-sm',
        className
      )}
    >
      <div className="px-6 pt-6">
        {userInfo}
      </div>

      {topBlock && (
        <div className="px-6 py-2">
          {topBlock}
        </div>
      )}

      {/* Menú/secciones */}
      <div className="px-5 flex-1">
        {children}
      </div>

      {footer && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-100">
          {footer}
        </div>
      )}
    </aside>
  );
}
