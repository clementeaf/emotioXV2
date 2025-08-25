import React from 'react';

const NoResearchIdError: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-4">
          ⚠️ Enlace de Acceso Inválido
        </h2>
        <p className="text-gray-600 mb-4">
          Para participar en esta investigación, necesitas un enlace único con tu identificación de participante.
        </p>
        <div className="text-sm text-gray-500 mb-4">
          <p className="font-medium mb-2">Tu enlace debe contener:</p>
          <code className="bg-gray-100 px-2 py-1 rounded block">
            ?researchId=XXX&participantId=YYY
          </code>
          <p className="text-xs mt-2 text-gray-400">
            o alternativamente:
          </p>
          <code className="bg-gray-100 px-2 py-1 rounded block mt-1">
            ?researchId=XXX&userId=YYY
          </code>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Este enlace es personal e intransferible.
        </p>
        <p className="text-xs text-gray-400">
          Si no tienes tu enlace, contacta al investigador o administrador del estudio.
        </p>
      </div>
    </div>
  );
};

export default NoResearchIdError;
