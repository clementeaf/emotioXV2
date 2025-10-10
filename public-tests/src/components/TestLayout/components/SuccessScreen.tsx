import React from 'react';
import { SuccessScreenProps } from './ThankYouScreenTypes';

/**
 * Componente para pantalla de éxito (gracias)
 */
export const SuccessScreen: React.FC<SuccessScreenProps> = ({ 
  contentConfiguration 
}) => {
  return (
    <div className='flex flex-col items-center justify-center h-full gap-6 p-8'>
      <h2 className='text-2xl font-bold text-gray-800 text-center'>
        {contentConfiguration.title || '¡Gracias por tu participación!'}
      </h2>
      {contentConfiguration.message && (
        <p className='text-gray-600 text-center max-w-2xl'>
          {contentConfiguration.message}
        </p>
      )}
    </div>
  );
};
