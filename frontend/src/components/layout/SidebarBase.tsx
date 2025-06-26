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
        'w-64 flex flex-col',
        className
      )}
    >
      {/* Header usuario */}
      <div className="px-6 pt-8 pb-6 border-b border-neutral-200">
        {userInfo}
      </div>

      {/* Bloque superior opcional (logo, nombre proyecto, etc) */}
      {topBlock && (
        <div className="px-6 pt-4 pb-3 border-b border-neutral-100">
          {topBlock}
        </div>
      )}

      {/* Menú/secciones */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {children}
      </div>

      {/* Footer (logout, etc) */}
      {footer && (
        <div className="px-4 py-4 border-t border-neutral-200 mt-auto">
          {footer}
        </div>
      )}
    </aside>
  );
}
