import React from 'react';

interface ThankYouViewProps {
  onComplete?: () => void;
  title?: string;
  message?: string;
  imageSrc?: string;
}

/**
 * Componente que muestra una pantalla de agradecimiento al finalizar las tareas cognitivas
 */
const ThankYouView: React.FC<ThankYouViewProps> = ({
  onComplete,
  title = 'Thank you so much!',
  message = 'You have been invited to participate in a survey to improve the future experience of our customers, so we need your help to make this the best experience possible.',
  imageSrc = '/couple-thank-you.jpg' // URL relativa a la imagen de la pareja
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Cabecera morada */}
      <div className="bg-indigo-700 text-white p-2.5 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-yellow-300 flex items-center justify-center mr-2">
            <span className="text-indigo-800 text-xs font-bold">E</span>
          </div>
          <span className="text-sm font-medium">Emolo</span>
        </div>
        <div className="text-xs">This is a preview. Your response will not be saved.</div>
        <div className="bg-indigo-600 rounded px-3 py-1 text-xs flex items-center">
          Jump to section
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex">
        {/* Sección izquierda (texto) */}
        <div className="w-1/2 bg-white flex flex-col justify-between p-12">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-4">
              {title}
            </h1>
            <p className="text-neutral-600 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Footer izquierdo */}
          <div className="text-xs text-neutral-500">
            This site is protected by reCAPTCHA and the Google <a href="#" className="text-indigo-600 hover:text-indigo-800">Privacy Policy</a>
          </div>
        </div>

        {/* Sección derecha (imagen) */}
        <div className="w-1/2 relative">
          {/* Siempre mostramos la imagen proporcionada o la de reserva que coincide con la imagen del diseño */}
          <img 
            src={imageSrc} 
            alt="Thank you" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Si la imagen falla, mostramos un fondo dorado similar al de la imagen
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent) {
                parent.style.backgroundColor = '#f0d6a7';
              }
            }} 
          />
          
          {/* Créditos de la imagen (si son necesarios) */}
          <div className="absolute bottom-0 right-0 p-2 text-[10px] text-white/60">
            Imagen de referencia / Reference image
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouView; 