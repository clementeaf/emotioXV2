import React from 'react';

const ExceededPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl">⏰</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Tiempo Excedido
        </h1>

        <p className="text-gray-600 mb-6">
          Has excedido el tiempo límite para completar la investigación. Los datos no serán considerados válidos.
        </p>

        <div className="bg-yellow-100 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 text-sm">
            <strong>Estado:</strong> Tiempo Excedido<br />
            <strong>Fecha:</strong> {new Date().toLocaleDateString()}<br />
            <strong>Motivo:</strong> Límite de tiempo superado
          </p>
        </div>

        <a
          href="/"
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-lg inline-block transition-colors"
        >
          🔙 Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default ExceededPage;
