import React from 'react';
import { Card } from '../layout';
import Spinner from './Spinner';

interface LoadingPageProps {
  message?: string;
  showCard?: boolean;
}

const LoadingPage: React.FC<LoadingPageProps> = ({ 
  message = 'Cargando...', 
  showCard = true 
}) => {
  const content = (
    <div className="text-center">
      <Spinner size="lg" color="blue" />
      <p className="mt-4 text-gray-600">{message}</p>
    </div>
  );

  if (showCard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f1f5f9' }}>
        <Card className="p-8 max-w-md w-full" padding="none">
          {content}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f1f5f9' }}>
      {content}
    </div>
  );
};

export default LoadingPage;
