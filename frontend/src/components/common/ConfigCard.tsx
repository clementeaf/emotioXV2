import React from 'react';

export interface ConfigCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Tarjeta de configuración con scroll interno y layout consistente para todas las secciones de configuración.
 * El scrollbar solo aparece dentro de la tarjeta, nunca en toda la página.
 */
export const ConfigCard: React.FC<ConfigCardProps> = ({ children, className = '', style }) => (
  <div
    className={`p-8 max-h-[calc(100vh-160px)] min-h-[400px] overflow-y-auto ${className}`}
    style={style}
  >
    {children}
  </div>
);
