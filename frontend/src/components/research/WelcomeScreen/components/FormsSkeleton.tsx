import React from 'react';

export const FormsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-96 bg-gray-200 rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 p-4 bg-white rounded-lg border border-neutral-100">
        {/* Título */}
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-32 w-full bg-gray-200 rounded"></div>
        </div>

        {/* Texto del botón */}
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
          <div className="h-10 w-full bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end space-x-2 mt-6 px-8 py-4 bg-neutral-50 rounded-lg border border-neutral-100">
        <div className="h-9 w-24 bg-gray-200 rounded"></div>
        <div className="h-9 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};
