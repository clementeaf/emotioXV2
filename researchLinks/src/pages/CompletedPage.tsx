import React from 'react';

const CompletedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl">✅</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Entrevista Completada
        </h1>

        <p className="text-gray-600 mb-6">
          ¡Gracias por completar la investigación! Tu participación ha sido registrada exitosamente.
        </p>

        <div className="bg-green-100 rounded-lg p-4 mb-6">
          <p className="text-green-800 text-sm">
            <strong>Estado:</strong> Completado<br />
            <strong>Fecha:</strong> {new Date().toLocaleDateString()}<br />
            <strong>ID:</strong> {Math.random().toString(36).substr(2, 9)}
          </p>
        </div>

        <a
          href="/"
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg inline-block transition-colors"
        >
          🔙 Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default CompletedPage;
