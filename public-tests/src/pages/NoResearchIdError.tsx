import React from 'react';

const NoResearchIdError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          ⚠️ Acceso Inválido
        </h2>
        <p className="text-gray-600 mb-4">
          Para acceder a una investigación, necesitas un enlace válido con un ID de investigación.
        </p>
        <p className="text-sm text-gray-500">
          Ejemplo: <code className="bg-gray-100 px-2 py-1 rounded">?researchId=tu-id-aqui</code>
        </p>
      </div>
    </div>
  );
};

export default NoResearchIdError;
