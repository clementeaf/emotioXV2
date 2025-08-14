import React from 'react';

const NoResearchIdError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          ⚠️ Acceso Inválido
        </h2>
        <p className="text-gray-600 mb-4">
          Para acceder a una investigación, necesitas un enlace válido con ambos parámetros requeridos.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <p className="font-medium mb-2">Formato requerido:</p>
          <code className="bg-gray-100 px-2 py-1 rounded block">
            ?researchId=ABC123&userId=XYZ789
          </code>
        </div>
        <p className="text-xs text-gray-400">
          Contacta al administrador de la investigación para obtener tu enlace único.
        </p>
      </div>
    </div>
  );
};

export default NoResearchIdError;
