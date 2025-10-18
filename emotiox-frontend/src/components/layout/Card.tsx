import React from 'react';
import type { CardProps } from './types';

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md' 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={`bg-white rounded-2xl ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
