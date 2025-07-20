import React from 'react';

const DisqualifiedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl">❌</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Entrevista Descalificada
        </h1>

        <p className="text-gray-600 mb-6">
          Lo sentimos, tu participación no cumple con los criterios requeridos para esta investigación.
        </p>

        <div className="bg-red-100 rounded-lg p-4 mb-6">
          <p className="text-red-800 text-sm">
            <strong>Estado:</strong> Descalificado<br />
            <strong>Fecha:</strong> {new Date().toLocaleDateString()}<br />
            <strong>Motivo:</strong> No cumple criterios
          </p>
        </div>

        <a
          href="/"
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg inline-block transition-colors"
        >
          🔙 Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default DisqualifiedPage;
