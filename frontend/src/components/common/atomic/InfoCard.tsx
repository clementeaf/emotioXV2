import React from 'react';
import { BookOpen } from 'lucide-react';

interface InfoCardProps {
  title: string;
  description: string;
  details?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  description,
  details,
  icon = <BookOpen className="h-4 w-4 text-blue-600" />,
  className = ''
}) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center mb-2">
        {icon}
        <h4 className="font-medium text-sm text-blue-700 ml-2">{title}</h4>
      </div>
      
      <div className="text-xs text-blue-600 mb-3">
        <p>{description}</p>
      </div>
      
      {details && (
        <div className="text-xs text-blue-600">
          <div className="font-medium mb-1">Detalles:</div>
          <div className="whitespace-pre-line">{details}</div>
        </div>
      )}
    </div>
  );
};
