import React from 'react';
import PreviewHeader from '../layout/PreviewHeader';

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
  title = 'Thank you so much!',
  message = 'You have been invited to participate in a survey to improve the future experience of our customers, so we need your help to make this the best experience possible.',
  imageSrc = '/couple-thank-you.jpg' // URL relativa a la imagen de la pareja
}) => {
  return (
    <div className="w-full h-full flex flex-col">
      <PreviewHeader />
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