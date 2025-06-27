import React, { useState } from 'react';
import fondoFinal from '../../assets/fondo-final.png';
import { SmartVocThankYouViewComponentProps } from '../../types/smart-voc.types';
import { ResponsesViewer } from '../flow/ResponsesViewer';

// Componente para la pantalla de agradecimiento final
export const ThankYouView: React.FC<SmartVocThankYouViewComponentProps> = ({
  message = '¡Gracias por participar en nuestro estudio!',
  onContinue,
  responsesData
}) => {
  const [showResponses, setShowResponses] = useState(false);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex w-full flex-grow">
        {/* Lado izquierdo - Mensaje de agradecimiento */}
        <div className="w-1/2 bg-white flex flex-col justify-between p-12">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">¡Muchas gracias!</h1>

            <p className="text-neutral-600 leading-relaxed mb-8">
              {message}
            </p>

            <div className="space-y-4">
              {responsesData && (
                <button
                  onClick={() => setShowResponses(!showResponses)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showResponses ? 'Ocultar respuestas' : 'Ver mis respuestas'}
                </button>
              )}

              {onContinue && (
                <button
                  onClick={onContinue}
                  className="w-full px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mt-4"
                >
                  Finalizar
                </button>
              )}
            </div>
          </div>

          {/* Footer izquierdo */}
          <div className="text-xs text-neutral-500">
            Este sitio está protegido por reCAPTCHA y la <a href="#" className="text-indigo-600 hover:text-indigo-800">Política de Privacidad</a> de Google
          </div>
        </div>

        {/* Lado derecho - Imagen de fondo */}
        <div className="w-1/2 relative">
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
            <img
              src={fondoFinal}
              alt="Thank you background"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Créditos de la imagen (si son necesarios) */}
          <div className="absolute bottom-0 right-0 p-2 text-[10px] text-white/60">
            Imagen de referencia / Reference image
          </div>
        </div>
      </div>

      {/* Visor de respuestas (aparece como una capa sobre todo) */}
      {showResponses && responsesData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-auto">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-auto">
            <ResponsesViewer
              data={responsesData}
              onClose={() => setShowResponses(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThankYouView;
