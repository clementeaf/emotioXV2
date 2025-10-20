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
        'w-full h-full flex flex-col',
        className
      )}
    >
      <div className="px-6 pt-8">
        {userInfo}
      </div>

      {topBlock && (
        <div className="px-6">
          {topBlock}
        </div>
      )}

      {/* Menú/secciones */}
      <div className="px-4">
        {children}
      </div>

      {footer && (
        <div className="pb-4 pt-2">
          {footer}
        </div>
      )}
    </aside>
  );
}
